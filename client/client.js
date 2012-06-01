Users = new Meteor.Collection("users");
UserRooms = new Meteor.Collection("userrooms");
Messages = new Meteor.Collection("messages");

Template.paotalk.signed_in = function () {
  return Session.get("userid");
};

Template.landing.events = {
  'click input.fbloginbutton': function () {
    FB.login();
  }
};

Template.header.username = function () {
  return Session.get("username");
};

Template.header.events = {
  'click input.logoutbutton': function () {
    FB.logout();
  }
};

Template.roomlistpanel.rooms = function () {
  return UserRooms.find({});
};

Template.roomlistpanel.events = {
  'click input.createroombutton': function () {
    var roomtext = document.getElementById("createroomtext");
    if (roomtext.value) {
      Meteor.call("createRoom", Session.get("userid"), roomtext.value);
      roomtext.value = "";
    }
  }
};

Template.roomitem.events = {
  'click span.roomname': function () {
    var showroomname = "showroom_" + this.roomid;
    if (Session.get(showroomname)) {
      Session.set(showroomname, 0);
    } else {
      Session.set(showroomname, 1);
    }
  }
};

Template.friendpanel.username = Template.header.username;

Template.friendpanel.friends =  function () {
  return Users.find({});
};

Template.friend.status = function () {
  if (!this.lastactive) { return "offline"; } // TODO: delete this later
  // using Session var to cause an invalidate to occur when it is updated
  return ((Session.get("currenttime") - this.lastactive) > 10000) ? "offline": "online";
};

Template.activerooms.rooms = Template.roomlistpanel.rooms;

Template.room.messages = function () {
  return Messages.find({roomid:this.roomid});
};

Template.room.events = {
  'click input.sendbutton': function () {
    /*Meteor.call('sendMessage',
      this.roomid,
      Session.get("userid"),
      Session.get("username"),
      document.getElementById("messagetext_" + this.roomid).value,
      function (err, result) {
        //alert("err " + err + " result " + result);
      }
    );*/
    Messages.insert({
      roomid:this.roomid,
      authorid:Session.get("userid"),
      authorname:Session.get("username"),
      message:document.getElementById("messagetext_" + this.roomid).value
    });
  },
  'click input.showaddfriendsbutton': function () {
    Session.set("addingfriendstoroom_" + this.roomid, 1);
  },
  'click input.hideaddfriendsbutton': function () {
    Session.set("addingfriendstoroom_" + this.roomid, 0);
  },
  'click input.addfriendsbutton': function () {
    var friendstoaddlist = document.getElementById("friendsforroom_" + this.roomid);
    if (friendstoaddlist.hasChildNodes()) {
      var friendnodes = friendstoaddlist.children;
      var friendidstoadd = [];
      for (var i = 0; i < friendnodes.length; i++) {
        var friendnode = friendnodes[i].children[0]; // firstChild equivalent for only element type nodes
        if (friendnode.checked) {
          friendidstoadd.push(friendnode.value);
        }
      }

      for (var i = 0; i < friendidstoadd.length; i++) {
        Meteor.call('addUserToRoom',
          friendidstoadd[i],
          this.roomid,
          this.roomname
        );
      }
    }
  }
};

Template.room.showroom = function () {
  return Session.get("showroom_" + this.roomid);
};

Template.room.addingfriends = function () {
  return Session.get("addingfriendstoroom_" + this.roomid);
};

Template.room.isadmin = function () {
  return this.isadmin;
};

Template.room.friendsforadd =  function () {
  return Users.find({});
};

Template.message.readabledatetime = function () {
  return new Date(this.datetime).toLocaleTimeString();
};

Template.message.serverconfirmed = function () {
  return this.datetime;
};
