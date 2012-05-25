Users = new Meteor.Collection("users");
Rooms = new Meteor.Collection("rooms");
Messages = new Meteor.Collection("messages");

console.log("server outer code");

Meteor.startup(function () {
  console.log("meteor startup");
});

Meteor.publish("friendslist", function (userid) {
  var user = Users.findOne(userid);
  if (user && user.friends) {
    // TODO: user.friends will not establish a reactive context for invalidation
    return Users.find({_id: {$in : user.friends}});
  } 
});

Meteor.methods({
  getUserIdFromFbId: function (fbuser) {
    console.log("getuseridfromfbid");
    var user = Users.findOne({fbid: fbuser.id});
    if (user && user._id) {
      console.log("found user doc");
      return user;
    } else {
      console.log("inserting user doc");
      // First logon
      var userid = Users.insert({
        name:fbuser.name,
        fbid:fbuser.id
      });
      
      var ptuser = Users.findOne({_id:userid});
      ptuser.firstlogon = 1;
      return ptuser;
    }
  },
  addFriendsFromFb: function (userid, friends) {
    // Check to see who is already on paotalk
    // Add all registered paotalk users to friendslist
    // and update all corresponding friendslists
    console.log("addFriendsFromFb");
    var friendids = new Array();
    for (var f in friends) {
      var friend = Users.findOne({fbid:friends[f].id});
      if (friend) {
        friendids.push(friend._id);
        // Add current user to friends' friend list
        Users.update(friend._id, {$push : { friends : userid }});
      }
    }

    // Add friends to friendlist
    Users.update(userid, {$pushAll : {friends: friendids}});
  },
  /*getFriends: function (userid) {
    console.log("getFriends");
    var user = Users.findOne({_id:userid});
    if (user && user.friends) {
      return Users.find({_id: {$in : user.friends}});
    }
  },*/
  updateUserStatus: function (userid) {
    // returning the current SERVER time so proper time comparisons
    // can be calculated on the client side
    Users.update(userid, {$set: {lastactive: new Date().getTime()}});                  
    return new Date().getTime();
  },
  test: function (x) {
    console.log("test function: " + x);
    return x;
  }
});

