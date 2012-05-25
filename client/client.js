Users = new Meteor.Collection("users");

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

Template.friendpanel.username = Template.header.username;

Template.friendpanel.friends =  function () {
  return Users.find({});
};

Template.friend.status = function () {
  if (!this.lastactive) { return "offline"; } // TODO: delete this later
  // using Session var to cause an invalidate to occur when it is updated
  return ((Session.get("currenttime") - this.lastactive) > 10000) ? "offline": "online";
};
