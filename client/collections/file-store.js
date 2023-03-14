var fileStore = new FS.Store.S3("file-store");

FileStore = new FS.Collection("file-store", {
  stores: [ fileStore ],
  filter: {
    allow: {
    }
  }
})
