Users = new Meteor.Collection("users");
UserRooms = new Meteor.Collection("userrooms");
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

Meteor.publish("userroomlist", function (userid) {
  return UserRooms.find({userid:userid});
});

Meteor.publish("useradminroomlist", function (userid) {
  var useradminrooms = UserRooms.find({userid:userid, isadmin:1}).fetch();

  return UserRooms.find({roomid: {$in: useradminroomd}});
});

Meteor.publish("messagelist", function () {
  /*if (roomids) {
    var rooms = roomids.split(',');
    //for (var i = 0; i < rooms.length; i++) { console.log("room" + i + "=" + rooms[i]); }
    console.log(rooms.length);
    return Messages.find({roomid: {$in : rooms}});
  }*/
  //return Messages.find({roomid:0});
  return Messages.find({});
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

    var newfriendids = new Array();
    for (var f in friends) {
      var friend = Users.findOne({fbid:friends[f].id});
      if (friend && friend.friends && friend.friends.indexOf(userid) >= 0) {
        // skip if already friends
        continue;
      }

      if (friend) {
        newfriendids.push(friend._id);
        // Add current user to friends' friend list
        Users.update(friend._id, {$push : { friends : userid }});
      }
    }

    // Add friends to friendlist
    Users.update(userid, {$pushAll : {friends: newfriendids}});
  },
  updateUserStatus: function (userid, userstatus) {
    // returning the current SERVER time so proper time comparisons
    // can be calculated on the client side
    var datetime = new Date().getTime();
    Users.update(userid, {$set: {lastactive: datetime, status:userstatus}});
  },
  createRoom: function (userid, roomname) {
    if (!validateRoomName(roomname)) { return; }
    var roomid = Rooms.insert({
      roomname:roomname
    });

    var user = Users.findOne({_id:userid}); // only used for username

    // both user and room name here denormalize the db
    UserRooms.insert({
      userid:userid,
      username:user.name,
      roomid:roomid,
      roomname:roomname,
      isadmin:1
    });
  },
  addUserToRoom: function (userid, roomid, roomname) {
    if (UserRooms.find({userid:userid, roomid:roomid}).fetch().length) {
      // User is already in room
      return;
    }

    var user = Users.findOne({_id:userid}); // only used for username

    // both user and room name here denormalize the db
    UserRooms.insert({
      userid:userid,
      username:user.name,
      roomid:roomid,
      roomname:roomname
    });

    var system = Users.findOne({system:1});
    var useradded = Users.findOne({_id:userid});
    Messages.insert({
      roomid:roomid,
      authorid:system._id,
      authorname:system.name,
      message:useradded.name + " has been added to the room."
    });
  },
  test: function (x) {
    console.log("test function: " + x);
    return x;
  }
});

var messagehandle = Messages.find({}).observe({
  added: function (message) {
    console.log("added message id: " + message._id);
    if (!message.datetime) {
      Messages.update({_id:message._id}, {$set: {datetime:new Date().getTime()}});
    }
  }
});

// put this in a closure
var statusupdateinterval = 60000;
var userstatus = Meteor.setInterval(function () {
  var currdifftime = new Date().getTime() - statusupdateinterval;
  Users.update(
    {lastactive: {$lt: currdifftime}, status: 'online'},
    {$set: {status: 'offline'}},
    {multi: true}
  );
}, statusupdateinterval);

