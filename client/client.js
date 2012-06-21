Users = new Meteor.Collection("users");
UserRooms = new Meteor.Collection("userrooms");
Messages = new Meteor.Collection("messages");

/*Meteor.autosubscribe(function () {
  Meteor.subscribe("messagelist", Session.get("activerooms"));
});*/

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
  'click span.logoutbutton': function () {
    FB.logout();
  }
};

Template.roomlistpanel.rooms = function () {
  return UserRooms.find({});
};

Template.roomlistpanel.showcreateroom = function () {
  return Session.get("showcreateroom");
};

Template.roomlistpanel.events = {
  'click a.createroombutton': function () {
    var roomtext = document.getElementById("createroomtext");
    /*if (isURL(roomtext.value)) { alert("isurl"); } else { alert("noturl"); } */
    if (validateRoomName(roomtext.value)) {
      Meteor.call("createRoom", Session.get("userid"), roomtext.value);
      roomtext.value = "";
      Session.set("showcreateroom", 0);
    } else {
      if (!roomtext.value) {
        alert("Please enter a name for this new room");
      } else if (/[^a-zA-Z0-9]/.test(roomtext.value)) {
        alert("Please only use alphanumeric characters");
      } else if (roomtext.value.length > 32) {
        alert("Please limit your room names to 24 characters or less");
      } else {
        alert("Invalid room name. Please limit your room names to 32 characters and only use alphanumeric characters");
      }
    }
  },
  'click a.addroomsbutton': function () {
    Session.set("showcreateroom", 1);
  },
  'click a.canceladdroomsbutton': function () {
    Session.set("showcreateroom", 0);
  }
};

var activeRooms = new Array(); // closure this
Template.roomitem.events = {
  'click div.roomitem': function () {
    updateActiveRooms(this.roomid);
  }
};

Template.roomitem.isactive = function () {
  var showroomname = "showroom_" + this.roomid;
  if (Session.get(showroomname)) {
    return "active";
  }

  return "inactive";
};

Template.friendpanel.username = Template.header.username;

Template.friendpanel.friends =  function () {
  return Users.find({});
};

Template.friend.status = function () {
  return this.status;
};

Template.activerooms.rooms = Template.roomlistpanel.rooms;

Template.room.messages = function () {
  return Messages.find({roomid:this.roomid});
};

Template.room.events = {
  'keypress textarea.messageinput': function (e) {
    if (e.keyCode == 13) { // enter pressed
      if (e.shiftKey) { return; }
      var messagetext = document.getElementById("messagetext_" + this.roomid);
      Messages.insert({
        roomid:this.roomid,
        authorid:Session.get("userid"),
        authorname:Session.get("username"),
        message:messagetext.value
      });

      messagetext.focus();
      messagetext.value = "";
      e.preventDefault(); // prevent a newline from being entered
    } else {
      // max length of message
      var messageinput = document.getElementById("messagetext_" + this.roomid);
      messageinput.value = messageinput.value.substring(0, 500);
    }
  },
  'paste textarea.messageinput': function (e) {
    // max length of message
    // need to rethink this. paste event occurs before the actual paste occurs
    var messageinput = document.getElementById("messagetext_" + this.roomid);
    messageinput.value = messageinput.value.substring(0, 500);
  },
  'click a.manageroombutton': function () {
    Session.set("managingroom_" + this.roomid, "addingfriends");
  },
  'click a.hideaddfriendsbutton': function () {
    Session.set("managingroom_" + this.roomid, 0);
  },
  'click a.addfriendstabheader': function () {
    Session.set("managingroom_" + this.roomid, "addingfriends");
  },
  'click a.removefriendstabheader': function () {
    Session.set("managingroom_" + this.roomid, "removingfriends");
  },
  'click a.settingstabheader': function () {
    Session.set("managingroom_" + this.roomid, "changingsettings");
  },
  'click a.addfriendsbutton': function () {
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

    Session.set("managingroom_" + this.roomid, 0);
  },
  'click a.removefriendsbutton': function () {
    // TODO: IMPLEMENT
    alert("Sorry, this is not yet implemented.");
    Session.set("managingroom_" + this.roomid, 0);
  },
  'click a.settingsbutton': function () {
    // TODO: IMPLEMENT
    Session.set("managingroom_" + this.roomid, 0);
  }
};

Template.room.showroom = function () {
  return Session.get("showroom_" + this.roomid);
};

Template.room.managing = function () {
  return Session.get("managingroom_" + this.roomid);
};

Template.room.addingfriends = function () {
  return Session.get("managingroom_" + this.roomid) === "addingfriends" ? "selected" : "";
};

Template.room.removingfriends = function () {
  return Session.get("managingroom_" + this.roomid) === "removingfriends" ? "selected" : "";
};

Template.room.changingsettings = function () {
  return Session.get("managingroom_" + this.roomid) === "changingsettings" ? "selected" : "";
};

Template.room.isadmin = function () {
  return this.isadmin;
};

Template.room.friendstoadd = function () {
  return Users.find({});
  // TODO OPTIMIZE PLS. THIS FEELS HIGHLY INEFFICIENT
  // TODO NVM IT'S JUST WRONG! AHH
  /*var usersinroom = UserRooms.find({roomid: this.roomid}).fetch();
  var useridsinroom = new Array();
  for (var i = 0; i < usersinroom.length; i++) {
    useridsinroom.push(usersinroom[i].userid);
  }

  var friends = Users.find({}).fetch();
  var friendidstoadd = new Array();
  for (var i = 0; i < friends.length; i++) {
    if (useridsinroom.indexOf(friends[i]._id) < 0) {
      // user is not in the room
      friendidstoadd.push(friends[i]._id);
    }
  }

  return UserRooms.find({userid: {$in: friendidstoadd}});*/
};

Template.room.friendstoremove = function () {
  //return Users.find({});
  return UserRooms.find({roomid:this.roomid, userid: {$ne: Session.get("userid")}});
};

Template.message.readabledatetime = function () {
  return new Date(this.datetime).toLocaleTimeString();
};

Template.message.serverconfirmed = function () {
  return this.datetime;
};

var autoScroll = function () {
  for (var i = 0; i < activeRooms.length; i++) {
    var roomid = activeRooms[i];
    var messagelist = document.getElementById("room_" + roomid + "_messagelist");
    var scrollheight = messagelist.scrollHeight;

    var scrollheightvarname = "room_" + roomid + "_scrollheight";
    if (Session.get(scrollheightvarname) < scrollheight) {
      messagelist.scrollTop = scrollheight;
    }
    Session.set(scrollheightvarname, scrollheight);
  }
};

function showRooms(roomids) {
  for (var i = 0; i < roomids.length; i++) {
    Session.set("showroom_" + roomids[i], 1);
  }
}

function hideRooms(roomids) {
  for (var i = 0; i < roomids.length; i++) {
    Session.set("showroom_" + roomids[i], 0);
  }
}

function updateActiveRooms(roomid) {
  var maxActiveRooms = Math.floor((window.innerWidth - 170 - 15) / 470); // TODO: remove hardcode

  if (!roomid) {
    if (activeRooms.length > maxActiveRooms) {
      var closingrooms = activeRooms.splice(maxActiveRooms);
      Session.set("activerooms", activeRooms.join());
      hideRooms(closingrooms);
    }

    return;
  }

  var showroomname = "showroom_" + roomid;
  if (Session.get(showroomname)) {
    activeRooms.splice(activeRooms.indexOf(roomid), 1);
    Session.set("activerooms", activeRooms.join());
    Session.set(showroomname, 0);
  } else {
    if (maxActiveRooms < 1) {
      hideRooms(activeRooms);
      activeRooms = [];
    } else {
      if (activeRooms.length >= maxActiveRooms) {
        var closingrooms = activeRooms.splice(maxActiveRooms - 1);
        hideRooms(closingrooms);
      }
      
      activeRooms.push(roomid);

      // Initialize room scrollheight if not already set
      var scrollheightvarname = "room_" + roomid + "_scrollheight";
      if (!Session.get(scrollheightvarname)) {
        Session.set(scrollheightvarname, 0);
      }
    }
    
    Session.set("activerooms", activeRooms.join());
    showRooms(activeRooms);
  }
};

window.onresize = function () {
  updateActiveRooms();
};

Meteor.setInterval(autoScroll, 1000);
