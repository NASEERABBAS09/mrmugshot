/*
structure:
- name
- code
- value
- description
- createdAt
- updatedAt
*/

/* Publishes */
Meteor.publish("settings", function () {
  return Settings.find({})
});

/* Methods */
Meteor.methods({
  updateMugshotPrice: function (mugshotPrice) {
    console.log(mugshotPrice);
    let currUser =  Meteor.user();
    if (! currUser ||
        !Roles.userIsInRole(currUser, ['admin'])) {
      throwError('permission-denied');
    }

    try {
      delete mugshotPrice["updatedAt"];
      delete mugshotPrice["createdAt"];
      check(mugshotPrice, {
        _id: String,
        code: String,
        unit: String,
        perYear: Number,
        perMugshot: Number
      });
    } catch (error) {
      throwError('invalid-data');
    }

    if (mugshotPrice.code !== 'mugshot_price') {
      throwError('invalid-data');
    }

    mugshotPrice.updatedAt = moment.utc().toDate();

    let id = mugshotPrice._id;
    delete mugshotPrice["_id"];

    let oldPrice = Settings.findOne({_id: id});

    if (oldPrice.perYear != mugshotPrice.perYear) {
      updateStripePlan(mugshotPrice.perYear);
    }

    let mugshotPriceID = Settings.update({_id: id}, {'$set': mugshotPrice}, {multi: true});

    return mugshotPriceID;
  },
});