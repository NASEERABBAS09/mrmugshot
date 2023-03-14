Meteor.publish("terms-privacy", function () {
  // return [TermsPrivacy.find({}), FileStore.find({})];
  return [TermsPrivacy.find({})];
});

TermsPrivacy.allow({
  insert: function(userId, docs) {
    return (Meteor.user().roles[0] == 'admin');
  },
  remove: function(userId, docs) {
    return (Meteor.user().roles[0] == 'admin');
  },
  update: function(userId, docs) {
    return (Meteor.user().roles[0] == 'admin');
  }
});