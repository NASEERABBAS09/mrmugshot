/* Methods */
// var attachmentStores = new FS.Store.S3("attachments", {
//   accessKeyId: 'AKIAIBXIUQHLMPVKR5SA',
//   secretAccessKey: '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',
//   bucket: 'frt-lawdawgs-dev'
// })
// FS.debug = true;

var fileStore = new FS.Store.S3("file-store", {
  accessKeyId: Meteor.settings.AWSAccessKeyId,
  secretAccessKey: Meteor.settings.AWSSecretAccessKey,
  bucket: Meteor.settings.AWSBucket,
  folder: "files"
});

FileStore = new FS.Collection("file-store", {
  stores: [ fileStore ],
  filter: {
    allow: {}
  }
});

/* Publishes */
// Meteor.publish('file-store', function() {
//   console.log(FileStore.find({}).count());
//   return FileStore.find({});
// });

FileStore.allow({
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
    return true;
  }
});

Meteor.methods({
});
