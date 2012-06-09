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
  'click span.logoutbutton': function () {
    FB.logout();
  }
};

Template.roomlistpanel.rooms = function () {
  var rooms = UserRooms.find({});
  if (rooms.count() == 0) { rooms = 0; }
  return rooms;
};

Template.roomlistpanel.showcreateroom = function () {
  return Session.get("showcreateroom");
};

Template.roomlistpanel.events = {
  'click span.createroombutton': function () {
    var roomtext = document.getElementById("createroomtext");
    if (roomtext.value) {
      Meteor.call("createRoom", Session.get("userid"), roomtext.value);
      roomtext.value = "";
      Session.set("showcreateroom", 0);
    }
  },
  'click div.addroomsbutton': function () {
    Session.set("showcreateroom", 1);
  },
  'click span.canceladdroomsbutton': function () {
    Session.set("showcreateroom", 0);
  }
};

var activeRooms = new Array(); // closure this
Template.roomitem.events = {
  'click div.roomitem': function () {
    var showroomname = "showroom_" + this.roomid;
    if (Session.get(showroomname)) {
      Session.set(showroomname, 0);
      activeRooms.splice(activeRooms.indexOf(this.roomid), 1);
    } else {
      Session.set(showroomname, 1);
      activeRooms.push(this.roomid);

      var scrollheightvarname = "room_" + this.roomid + "_scrollheight";
      if (!Session.get(scrollheightvarname)) {
        Session.set(scrollheightvarname, 0);
      }
    }
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
      var messagetext = document.getElementById("messagetext_" + this.roomid);
      Messages.insert({
        roomid:this.roomid,
        authorid:Session.get("userid"),
        authorname:Session.get("username"),
        message:messagetext.value
      });

      messagetext.value = "";
      messagetext.focus();
    }
  },
  'click span.showaddfriendsbutton': function () {
    Session.set("addingfriendstoroom_" + this.roomid, 1);
  },
  'click span.hideaddfriendsbutton': function () {
    Session.set("addingfriendstoroom_" + this.roomid, 0);
  },
  'click span.addfriendsbutton': function () {
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

Meteor.setInterval(autoScroll, 1000);
