/*
structure:
- state
- county
- name
- sex
- race
- dob
- stateOfBirth
- cityOfBirth
- bookedDate
- releasedDate
- chargeDescription
- file
- status
- owner
- createdAt
- updatedAt
*/
var fs = Npm.require('fs'),
  Fiber = Npm.require('fibers');
Future = Npm.require('fibers/future');
// Root of Meteor.js App
assets_root = Npm.require('fs').realpathSync(process.cwd() + Meteor.settings.watermarkPath);
/* Publishes */
Meteor.publish("mugshots", function() {
  return [Mugshots.find({}), Attachments.find({})];
});
Meteor.publish("type_mugshots", function(status) {
  return [Mugshots.find({
    status: status
  }), Attachments.find({
    status: status
  })];
});
Meteor.publish("mugshots_management", function(options) {
  if (!_.isEmpty(options)) {
    let type = 'approvedAt';
    let reverse = -1;
    let findQuery = {};
    let sortQuery = {};
    let selectedState = '';
    let selectedCounty = '';
    if (options.sortType) {
      type = options.sortType.toString();
    }
    if (options.sortReverse) {
      reverse = 1;
    }
    sortQuery[type] = reverse;
    findQuery['status'] = 'approved';
    if (options.selectedState) {
      findQuery['state'] = options.selectedState;
    }
    if (options.selectedCounty) {
      findQuery['county'] = options.selectedCounty;
    }
    if (options.query) {
      let queryObj = {
        $regex: options.query,
        $options: 'msi'
      };
      findQuery['$or'] = [{
        state: queryObj
      }, {
        stateName: queryObj
      }, {
        county: queryObj
      }, {
        countyName: queryObj
      }, {
        name: queryObj
      }, {
        chargeDescription: queryObj
      }, {
        singlePurchase: queryObj
      }, {
        agencyName: queryObj
      }, {
        agencyPerson: queryObj
      }];
    }
    if (options.uploadFromDate || options.uploadToDate) {
      let rangeDate = {};
      if (options.uploadFromDate) {
        rangeDate['$gte'] = moment.utc(options.uploadFromDate, 'M/D/YYYY')._d;
      }
      if (options.uploadToDate) {
        rangeDate['$lte'] = moment.utc(options.uploadToDate, 'M/D/YYYY').endOf('day')._d;
      }
      findQuery['approvedAt'] = rangeDate;
    }
    let mugshots = Mugshots.find(findQuery, {
      sort: sortQuery,
      skip: (options.currentPage * options.itemsPerPage),
      limit: (options.itemsPerPage)
    });
    return [mugshots, Attachments.find({
      status: "approved"
    })];
  }
});
Meteor.publish('MugshotsApprovedCounter', function(options) {
  if (!_.isEmpty(options)) {
    let findQuery = {};
    let selectedState = '';
    let selectedCounty = '';

    findQuery['status'] = 'approved';
    if (options.selectedState) {
      findQuery['state'] = options.selectedState;
    }
    if (options.selectedCounty) {
      findQuery['county'] = options.selectedCounty;
    }
    if (options.query) {
      let queryObj = {
        $regex: options.query,
        $options: 'msi'
      };
      findQuery['$or'] = [{
        state: queryObj
      }, {
        stateName: queryObj
      }, {
        county: queryObj
      }, {
        countyName: queryObj
      }, {
        name: queryObj
      }, {
        chargeDescription: queryObj
      }, {
        singlePurchase: queryObj
      }, {
        agencyName: queryObj
      }, {
        agencyPerson: queryObj
      }];
    }
    if (options.uploadFromDate || options.uploadToDate) {
      let rangeDate = {};
      if (options.uploadFromDate) {
        rangeDate['$gte'] = moment.utc(options.uploadFromDate, 'M/D/YYYY')._d;
      }
      if (options.uploadToDate) {
        rangeDate['$lte'] = moment.utc(options.uploadToDate, 'M/D/YYYY').endOf('day')._d;
      }
      findQuery['approvedAt'] = rangeDate;
    }
    let mugshots = Mugshots.find(findQuery);
    Counts.publish(this, 'approvedCounter', mugshots);
  }
});
Mugshots.allow({
  insert: function(userId, mugshot) {
    return (userId ? true : false);
  },
  remove: function(userId, mugshot) {
    return (userId ? true : false);
  },
  update: function(userId, mugshot) {
    return ((userId == mugshot.owner) || (Meteor.user().roles[0] == 'admin'));
  }
});
/* Methods */
Meteor.methods({
  'removeMugshotByAttId': function(mugshotId) {
    let currUser = Meteor.user();
    if (!currUser) {
      throwError('logged-out');
    }
    let mugshot = Mugshots.findOne({
      _id: mugshotId
    });
    // xoa file
    let keyObjectArr = [];
    if (mugshot.file) { // xoa file
      let s3FileKey = mugshot.file.relative_url.substr(1);
      keyObjectArr.push({
        Key: s3FileKey
      });
    }
    if (mugshot.fileOriginal) { // xoa file
      let s3FileKeyOriginal = mugshot.fileOriginal.relative_url.substr(1);
      keyObjectArr.push({
        Key: s3FileKeyOriginal
      });
    }
    if (mugshot.fileThumb) { // xoa file
      let s3FileKeyThumb = mugshot.fileThumb.relative_url.substr(1);
      keyObjectArr.push({
        Key: s3FileKeyThumb
      });
    }
    var params = {
      Bucket: Meteor.settings.AWSBucket,
      Delete: {
        Objects: keyObjectArr
      }
    };
    S3.aws.deleteObjects(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else console.log(data); // successful response
    });
    // xoa record
    Mugshots.remove({
      _id: mugshotId
    });
  },
  'approveMugshotByAttId': function(mugshotId) {
    let currUser = Meteor.user();
    if (!currUser) {
      throwError('logged-out');
    }
    let mugshot = Mugshots.findOne({
      _id: mugshotId
    });
    if (!mugshot) {
      throwError('not-exist');
    }
    let approvedAt = mugshot.approvedAt || new Date();
    approvedWatermark(mugshotId, approvedAt);
    // Mugshots.update({
    //   _id: mugshotId
    // }, {
    //   $set: {
    //     status: "approved",
    //     updatedAt: new Date(),
    //     approvedAt: new Date(),
    //     action: "enable"
    //   }
    // });
  },
  'deleteAllUpload': function(userId) {
    let currUser = Meteor.user();
    if (!currUser) {
      throwError('logged-out');
    }
    // remove attachments
    let mugshotArr = Mugshots.find({
      "status": "pending",
      "owner": userId
    }).fetch();
    // remove pending mugshots
    Mugshots.remove({
      "status": "pending",
      "owner": userId
    });
    deleteObjectArr(mugshotArr);
    return true;
  },
  'deleteAllApprove': function(recordId) {
    let currUser = Meteor.user();
    if (!currUser) {
      throwError('logged-out');
    }
    // remove attachments
    let mugshotArr = Mugshots.find({
      "status": "submitted",
      "submitId": recordId
    });
    deleteObjectArr(mugshotArr);
    // remove pending mugshots
    Mugshots.remove({
      "status": "submitted",
      "submitId": recordId
    });
    // remove submit record
    SubmitRecord.remove({
      _id: recordId
    });
    return true;
  },
  'changeAgency': function(userId, agencyName, agencyPerson) {
    let currUser = Meteor.user();
    if (!currUser) {
      throwError('logged-out');
    }
    Mugshots.update({
      "owner": userId
    }, {
      $set: {
        agencyName: agencyName,
        agencyPerson: agencyPerson
      }
    }, {
      multi: true
    });
  },
  'getS3Url': function(key) {
    this.unblock();
    var params = {
      Bucket: Meteor.settings.AWSBucket,
      Key: key,
      Expires: 600
    };
    var url = S3.aws.getSignedUrl('getObject', params);
    return url;
  },
  'deleteS3Objects': function(keyObjectArr) {
    var params = {
      Bucket: Meteor.settings.AWSBucket,
      Delete: {
        Objects: keyObjectArr
      }
    };
    S3.aws.deleteObjects(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else console.log(data); // successful response
    });
  },
  'submitMugshots': function() {
    let currUser = Meteor.user();
    if (!currUser) {
      throwError('logged-out');
    }
    // get variable
    let mugshotArr = Mugshots.find({
      status: "pending",
      owner: Meteor.userId()
    });
    console.log(mugshotArr.count());
    let validMugshotArr = [];
    // check valid and submit mugshots
    mugshotArr.forEach(function(item, index) {
      // if ((item.file !== null) && (item.fileThumb !== null) && item.state && item.county && checkAgency(users, item.agencyName, item.agencyPerson) && (item.name || item.sex || item.race || item.dob || item.stateOfBirth || item.cityOfBirth || item.bookedDate || item.releasedDate || item.chargeDescription || item.approvedAt)) {
      //   validMugshotArr.push(item._id);
      // }
      if ((item.fileOriginal !== null) && (item.name || item.sex || item.race || item.dob || item.stateOfBirth || item.cityOfBirth || item.bookedDate || item.releasedDate || item.chargeDescription || item.approvedAt)) {
        if (Roles.userIsInRole(Meteor.user(), 'admin')) {
          let users = Meteor.users.find({
            roles: {
              $in: ["sheriff"]
            }
          }, {
            fields: {
              'profile.agency': 1,
              'profile.name': 1
            }
          });
          if (item.state && item.county && checkAgency(users, item.agencyName, item.agencyPerson)) {
            validMugshotArr.push(item._id);
          }
        } else {
          validMugshotArr.push(item._id);
        }
      }
    });
    // create submitRecord
    if (validMugshotArr.length > 0) {
      let submitId = SubmitRecord.insert({
        agency: Meteor.user().profile.agency,
        userId: Meteor.userId(),
        userName: Meteor.user().profile.name,
        count: validMugshotArr.length,
        createdAt: new Date(),
        status: "pending",
        state: Meteor.user().profile.state,
        county: Meteor.user().profile.county
      });
      // update mugshots
      validMugshotArr.forEach(function(item, index) {
        Mugshots.update({
          _id: item
        }, {
          $set: {
            status: "submitted",
            submitId: submitId
          }
        });
      });
    }
    return validMugshotArr.length;
  },
  'approveMugshots': function(submitId) {
    let currUser = Meteor.user();
    if (!currUser) {
      throwError('logged-out');
    }
    // get variable
    let mugshotArr = Mugshots.find({
      status: "submitted",
      submitId: submitId
    });
    console.log(mugshotArr.count());
    let validMugshotArr = [];
    // check valid and approve mugshots
    let users = Meteor.users.find({
      roles: {
        $in: ["sheriff"]
      }
    }, {
      fields: {
        'profile.agency': 1,
        'profile.name': 1
      }
    });
    mugshotArr.forEach(function(item, index) {
      if ((item.fileOriginal !== null) && item.state && item.county && checkAgency(users, item.agencyName, item.agencyPerson) && (item.name || item.sex || item.race || item.dob || item.stateOfBirth || item.cityOfBirth || item.bookedDate || item.releasedDate || item.chargeDescription || item.approvedAt)) {
        validMugshotArr.push(item._id);
      }
    });

    // set status --> "approve"
    if (validMugshotArr.length > 0) {
      console.log("valid items: " + validMugshotArr.length);
      Mugshots.update({
        _id: { $in: validMugshotArr }
      }, {
        $set: {
          status: "processing"
        }
      }, {
        multi: true
      });

      // count down
      let count = SubmitRecord.findOne({
        _id: submitId
      }).count;
      count = count - validMugshotArr.length;
      if (count <= 0) { // het --> xoa
        console.log("het mugshot --> xoa");
        SubmitRecord.remove({
          _id: submitId
        });
      } else {
        console.log("mugshot con lai: " + count);
        SubmitRecord.update({
          _id: submitId
        }, {
          $set: {
            count: count
          }
        });
      }

      // update mugshots
      Meteor.call('watermarkAndThumbnail', validMugshotArr);

      // count down
      if (count <= 0) { // het --> xoa
        return "zero";
      } else {
        return validMugshotArr.length;
      }
    }
    return 0;
  },
  'updateStateCountyList': function(mugshotId) {
    check(mugshotId, String);
    this.unblock();
    let mugshot = Mugshots.findOne({
      _id: mugshotId
    });
    let updateAtrr = {
      state: mugshot.state,
      stateName: mugshot.stateName
    };
    updateAtrr["counties." + mugshot.county] = mugshot.countyName;
    StateCounty.update({
      state: mugshot.state
    }, {
      $set: updateAtrr
    }, {
      upsert: true
    });
  },
  'watermarkAndThumbnail': function(validMugshotArr) {
    console.log("dong watermark");
    // update mugshots
    for (let i = 0; i < validMugshotArr.length; i++) {
      let curMugshot = Mugshots.findOne({ _id: validMugshotArr[i] });
      let approvedAt = new Date();
      if (curMugshot && curMugshot.approvedAt) {
        approvedAt = curMugshot.approvedAt;
      }
      approvedWatermark(validMugshotArr[i], approvedAt);
      Meteor.call('updateStateCountyList', validMugshotArr[i]);
    }
  },
  'deleteStateCountyList': function(state, county) {
    check(state, String);
    check(county, String);
    this.unblock();
    let count = Mugshots.find({
      state: state,
      status: "approved"
    }).count();
    if (count == 0) {
      StateCounty.remove({
        state: state
      });
      return;
    }
    count = Mugshots.find({
      county: county,
      state: state,
      status: "approved"
    }).count();
    if (count == 0) {
      let updateAtrr = {};
      updateAtrr["counties." + county] = '';
      StateCounty.update({
        state: state
      }, {
        $unset: updateAtrr
      });
      return;
    }
  }
});

function deleteObjectArr(mugshotArr) {
  let keyObjectArr = [];
  mugshotArr.forEach(function(item, index) {
    if (item.file) { // xoa file
      let s3FileKey = item.file.relative_url.substr(1);
      keyObjectArr.push({
        Key: s3FileKey
      });
    }
    if (item.fileOriginal) { // xoa file
      let s3FileKeyOriginal = item.fileOriginal.relative_url.substr(1);
      keyObjectArr.push({
        Key: s3FileKeyOriginal
      });
    }
    if (item.fileThumb) { // xoa file
      let s3FileKeyThumb = item.fileThumb.relative_url.substr(1);
      keyObjectArr.push({
        Key: s3FileKeyThumb
      });
    }
  });
  if (!_.isEmpty(keyObjectArr)) {
    var params = {
      Bucket: Meteor.settings.AWSBucket,
      Delete: {
        Objects: keyObjectArr
      }
    };
    S3.aws.deleteObjects(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else console.log(data); // successful response
    });
  }
}

function checkAgency(userArr, agencyName, agencyPerson) {
  let agency = false;
  let person = false;
  userArr.forEach(function(item, index) {
    if (item.profile) {
      if (item.profile.agency && item.profile.agency == agencyName) {
        agency = true;
      }
      if (item.profile.name && item.profile.name == agencyPerson) {
        person = true;
      }
    }
  });
  return (agency && person);
}

function approvedWatermark(mugshotId, approvedAt) {
  let future = new Future();
  // search
  let mugshotArr = Mugshots.find({
    _id: mugshotId
  });
  mugshotArr.forEach(function(item, index) {

    // get file
    let params = {
      Bucket: Meteor.settings.AWSBucket,
      Key: item.fileOriginal.relative_url.substr(1)
    };
    // var url = S3.aws.getSignedUrl('getObject', params);
    S3.aws.getObject(params, function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        future.return(err);
        // return err;
      } else {
        // obtain the size of an image
        gm(data.Body).size(function(err, size) {
          if (!err) {
            // watermark
            // get propertive
            let hS = size.height,
              wS = size.width,
              hW = 480,
              wW = 558;
            // tinh chieu cao
            let newWaw = wS / 3,
              newWah = newWaw * hW / wW;
            let y = 30,
              x = wS - newWaw - y; // 30 --> padding 30px
            // watermark
            let file = gm(data.Body).draw(['image Over ' + x + ',' + y + ' ' + newWaw + ',' + newWah + ' ' + assets_root]);
            let streamWT = file.stream();
            // upload watermark
            let key = "watermark/attachments/" + "file_" + item._id + '.jpg';
            params = {
              Bucket: Meteor.settings.AWSBucket,
              Key: key,
              ACL: 'private',
              Body: streamWT
            };
            // let thumbFile = gm(data.Body).resize('192', '240').draw(['image Over 98,30 64,55 ' + assets_root]);
            let fileObj = {};
            S3.aws.upload(params, function(err, rs) {
              console.log(err, rs);
              if (!err) {
                Fiber(function() {
                  fileObj.relative_url = "/" + key;
                  // update collection
                  Mugshots.update({
                    _id: item._id
                  }, {
                    $set: {
                      file: fileObj
                    }
                  });
                }).run();
                // tao thumb
                file = gm(data.Body).resize('192', '240', '!').draw(['image Over 98,30 64,55 ' + assets_root]);
                streamWT = file.stream(); // LUU Y NEU DE STREAM RA NGOAI NO SE NHAN STREAM SAU
                key = "thumb/attachments/" + "thumb_" + item._id + '.jpg';
                params = {
                  Bucket: Meteor.settings.AWSBucket,
                  Key: key,
                  ACL: 'private',
                  Body: streamWT
                };
                // upload resize
                S3.aws.upload(params, function(err, rs) {
                  console.log(err, rs);
                  if (!err) {
                    Fiber(function() {
                      fileObj.relative_url = "/" + key;
                      // update collection
                      Mugshots.update({
                        _id: item._id
                      }, {
                        $set: {
                          fileThumb: fileObj,
                          status: 'approved',
                          action: "enable",
                          updatedAt: new Date(),
                          approvedAt: approvedAt
                        }
                      });
                    }).run();
                    future.return(true);
                  } else {
                    future.return(err);
                  }
                });
              }
            });
          } else {
            future.return(err);
          }
        });
      }
    });
  });
  return future.wait();
}
