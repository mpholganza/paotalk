// Load the FB JS SDK Asynchronously
(function (d) {
  var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
  if (d.getElementById(id)) { return; }
  js = d.createElement('script'); js.id = id; js.async = true;
  js.src = "//connect.facebook.net/en_US/all.js";
  ref.parentNode.insertBefore(js, ref);
} (document));

// listen for and handle auth.statusChange events
window.fbAsyncInit = function () {
  FB.init({
    appId: '397712360279294', // App ID
    // appId: '188842814549433', old app ID
    //channelUrl: '//guessanumber.com/channel.html', // Path to your Channel File
    status: true, // check login status
    cookie: true, // enable cookies to allow the server to access the session
    xfbml: true  // parse XFBML
  });

  FB.Event.subscribe('auth.statusChange', function (response) {
    if (response.authResponse) {
      FB.api('/me', function (me) {
        if (me.name) {
          Meteor.call("getUserIdFromFbId", me, function (err, result) {
            if (err) { alert(err); return; }
            logon(result);
          });
        }
      });
    } else {
      logoff();
    }
  });
}

function importFriends(userid) {
  // Should I just use session userid here instead of parameter?
  FB.api('me/friends', function (friends) {
    //for (f in friends.data) {
    //  alert("fbid: " + f.id);
    //}
    Meteor.call("addFriendsFromFb", userid, friends.data);
  });
}

var updateUserStatusTimer;
function logon(user) {
  // TODO: this doesn't have to be on every logon (might be unnecessary)
  importFriends(user._id)

  Session.set("userid", user._id);
  Session.set("username", user.name);
  Session.set("userfbid", user.fbid);

  Meteor.autosubscribe(function () {
    Meteor.subscribe("friendslist", Session.get("userid"));
  });

  Meteor.autosubscribe(function () {
    Meteor.subscribe("userroomlist", Session.get("userid"));
  });

  Meteor.autosubscribe(function () {
    Meteor.subscribe("useradminroomslist", Session.get("activerooms"));
  });

  Meteor.autosubscribe(function () {
    Meteor.subscribe("messagelist");
  });

  // TODO: remove hardcode of 1 minute
  updateUserStatus();
  updateUserStatusTimer = Meteor.setInterval(updateUserStatus, 60000);

  window.onbeforeunload = function () {
    logoff();
  };
 
  window.onunload = function () {
    logoff();
  };
}

function logoff() {
  Meteor.call("updateUserStatus", Session.get("userid"), 'offline');

  Session.set("userid", "");
  Session.set("username", "");
  Session.set("userfbid", "");

  Meteor.clearInterval(updateUserStatusTimer);
  FB.logout();
}

function updateUserStatus () {
  Meteor.call("updateUserStatus", Session.get("userid"), 'online');
}
