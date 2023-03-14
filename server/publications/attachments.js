S3.config = {
  key: Meteor.settings.AWSAccessKeyId,
  secret: Meteor.settings.AWSSecretAccessKey,
  bucket: Meteor.settings.AWSBucket,
  // region: 'eu-west-1' // Only needed if not "us-east-1" or "us-standard"
};

/* Publishes */
Meteor.publish('attachments', function() {
  return Attachments.find({});
});
/* Methods */
// var attachmentStores = new FS.Store.S3("attachments", {
//   accessKeyId: 'AKIAIBXIUQHLMPVKR5SA',
//   secretAccessKey: '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',
//   bucket: 'frt-lawdawgs-dev'
// })
// FS.debug = true;
var thumbStore = new FS.Store.S3("thumb", {
  accessKeyId: Meteor.settings.AWSAccessKeyId,
  secretAccessKey: Meteor.settings.AWSSecretAccessKey,
  bucket: Meteor.settings.AWSBucket,
  folder: "thumb",
  transformWrite: function(fileObj, readStream, writeStream) {
    gm(readStream, fileObj.name()).resize('192', '240').stream().pipe(writeStream);
  }
});
var originalStore = new FS.Store.S3("original", {
  accessKeyId: Meteor.settings.AWSAccessKeyId,
  secretAccessKey: Meteor.settings.AWSSecretAccessKey,
  bucket: Meteor.settings.AWSBucket,
  folder: "original"
});
Attachments = new FS.Collection("attachments", {
  stores: [thumbStore, originalStore],
  filter: {
    allow: {}
  }
});

Attachments.allow({
  insert: function(userId, fileObj) {
    return (userId ? true : false);
  },
  remove: function(userId, fileObj) {
    return (userId ? true : false);
  },
  download: function(userId, fileObj) {
    return (userId ? true : false);
  },
  update: function(userId, fileObj) {
    // if (!userId || !fileObj.attachable_type || !fileObj.attachable_id) {
    //   return false;
    // }
    // if (fileObj.attachable_type == 'profiles' && !fileObj.type().includes("image/")) {
    //   return false;
    // }
    return true;
  }
});
Meteor.methods({
  removeAttachByAttId: function(attId) {
    let currUser = Meteor.user();
    if (!currUser) {
      throwError('logged-out');
    }
    Attachments.remove({
      _id: attId
    });
  }
});
