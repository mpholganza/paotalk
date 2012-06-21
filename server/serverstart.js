Meteor.startup(function () {
  if (Users.find({system:1}).count() === 0) {
    // Add system user
    Users.insert({
      system:1,
      name:"justchilln"
    });
  }
});
