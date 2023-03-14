/* Publishes */
Meteor.publish("submitRecordPending", function () {
  return SubmitRecord.find({status: "pending"});
});

Meteor.publish("submitRecords", function () {
  return SubmitRecord.find({});
});

Meteor.publish('recordCounter', function() {
  Counts.publish(this, 'numberCounter', SubmitRecord.find({status: "pending"}));
});



SubmitRecord.allow({
  insert: function(userId, mugshot) {
    return (userId ? true : false);
  },
  remove: function(userId, mugshot) {
    return (userId ? true : false);
  },
  update: function(userId, mugshot) {
    return (userId ? true : false);
  }
});

/* Methods */
Meteor.methods({
  'createSubmitRecord': function(obj) {
    let currUser = Meteor.user();
    if (!currUser) {
      throwError('logged-out');
    }

    return SubmitRecord.insert({
      agency: obj.agency,
      userId: obj.userId,
      userName: obj.userName,
      count: obj.count,
      createdAt: obj.createdAt,
      status: obj.status,
      state: obj.state,
      county: obj.county
    });
  },
  'countDownSubmitRecord': function(itemId) {
    let currUser = Meteor.user();
    if (!currUser) {
      throwError('logged-out');
    }

    let count = SubmitRecord.findOne({_id: itemId}).count;

    if (count -1 === 0) { // het --> xoa
      SubmitRecord.remove({
        _id: itemId
      });
      return "zero";
    }
    else {
      SubmitRecord.update(
      { _id: itemId },
      {
        $set: {
          count: count - 1
        }
      });
    }
    return itemId;
  }
});