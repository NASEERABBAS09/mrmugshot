var thumbStore = new FS.Store.S3("thumb");
var originalStore = new FS.Store.S3("original");

Attachments = new FS.Collection("attachments", {
  stores: [thumbStore, originalStore],
  filter: {
    allow: {
      // contentTypes: ['image/*'],
      // extensions: ['png', 'PNG', 'jpg', 'JPG', 'jpeg', 'JPEG']
    }
  }
})
