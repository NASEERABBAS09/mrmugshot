angular.module('lawdawgs').directive('ldAttachmentsBtn', function() {
  return {
    restrict: 'E',
    scope: {},
    bindToController: {
      attachableType: '@',
      allowedType: '@',
      text: '@',
      numberFiles: '='
    },
    templateUrl: 'client/components/attachments/attachment-btn.html',
    controllerAs: 'attachmentCtrl',
    controller: AttachmentsController,
  };
});
AttachmentsController.$inject = ["$scope", "$reactive", "$filter", "$timeout", 'SweetAlert', '$compile'];

function AttachmentsController($scope, $reactive, $filter, $timeout, SweetAlert, $compile) {
  $reactive(this).attach($scope);
  var vm = this;
  this.currFile = "";
  this.agencyNameList = [];
  this.agencyPersonList = [];
  this.curNumberFile = 0;
  this.currentUser = Meteor.user();
  this.isAdmin = Roles.userIsInRole(this.currentUser, 'admin');
  this.helpers({
    attachments: () => {
      return Attachments.find({}, {
        sort: {
          uploadedAt: -1
        }
      })
    },
    mugshots: () => {
      return Mugshots.find({
        "status": "pending",
        "owner": Meteor.userId()
      }, {
        sort: {
          updatedAt: -1
        }
      })
    }
  });
  // get acency list
  Meteor.call('getAgency', function(error, result) {
    if (error) {
      console.log('failed', error);
    } else {
      vm.agencyNameList = result.agencyName;
      vm.agencyPersonList = result.agencyPerson;
    }
  });
  // assign functions
  this.attachFile = attachFile;
  var setTimeout = false;

  function attachFile(files) {
    let count = files.length;
    if (count <= 0) {
      return;
    }
    // show modal
    if ($('progress-modal').length == 0) {
      $('body').append($compile("<progress-modal />")($scope));
    }
    setTimeout = false;
    let data = {};
    data.images = [];
    let base64Str = "";
    let filePost = {};
    vm.curNumberFile = 0;
    for (let i = 0; i < count; i++) {
      let handleFile = files[i];
      if (vm.attachableType !== "'csv'") {
        let fileName = handleFile.name;
        let patt = new RegExp("\.zip$");
        let checkZip = patt.test(fileName);
        if (checkZip) { // neu la file zip
          // xu ly file zip
          handleZip(handleFile);
        } else { // xu ly file image
          vm.numberFiles = files.length;
          handleImg(handleFile, fileName);
        }
      } else { // xu ly file csv
        handleCSV(handleFile);
      }
    }
  }

  function handleZip(file) {
    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = function(e) {
      let zip = new JSZip();
      zip.load(reader.result); // doc file zip
      let zipFiles = zip.files;
      let nameList = Object.keys(zipFiles); // lay danh sach file
      vm.numberFiles = nameList.length;
      let arrayBufferView, blob, f;
      nameList.forEach(function(name, index) {
        arrayBufferView = zipFiles[name].asUint8Array();
        blob = new Blob([arrayBufferView], {});
        f = new File([blob], name, {
          type: "image/*"
        }); // tao file
        insertAttachment(f, name); // check and insert into DB
      });
    }
  }

  function handleCSV(file) {
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function(e) {
      let infoObj = $.csv.toObjects(reader.result); // Array of objects
      let i = 0,
        count = infoObj.length;
      vm.numberFiles = infoObj.length;
      let handleObj = {},
        mugshot = {};
      for (i; i < count; i++) {
        handleObj = infoObj[i];
        let fileName = handleObj["Image Filename"];
        mugshot = Mugshots.findOne({
          fileName: handleObj["Image Filename"],
          status: "pending",
          owner: Meteor.userId()
        });
        if (mugshot) { // neu tim thay thi update
          // nameLength lowCase
          let nameLength = parseInt(fileName.substr(0, fileName.lastIndexOf("."))) || Infinity;
          let itemId = mugshot._id;
          Mugshots.update({
            _id: itemId
          }, {
            $set: { // neu la sheriff thi khong duoc edit 4 fields
              name: handleObj["Name"],
              sex: handleObj["Sex"],
              race: handleObj["Race"],
              dob: generateDate(handleObj["DOB"]),
              stateOfBirth: handleObj["State of Birth"],
              cityOfBirth: handleObj["City of Birth"],
              bookedDate: generateDate(handleObj["Booked Date"]),
              releasedDate: generateDate(handleObj["Released Date"]),
              chargeDescription: handleObj["Charge Description"],
              approvedAt: generateDate(handleObj["Approved Date"]),
              updatedAt: new Date(),
              nameLength: nameLength,
              lowerName: fileName.toLowerCase()
            }
          });

          // update ui value for dates
          if ($('#row-' + itemId).length > 0) {
            $('#' + itemId + '-dob').val($filter('date')(generateDate(handleObj["DOB"]), 'M/d/yyyy'));
            $('#' + itemId + '-bookedDate').val($filter('date')(generateDate(handleObj["Booked Date"]), 'M/d/yyyy'));
            $('#' + itemId + '-releasedDate').val($filter('date')(generateDate(handleObj["Released Date"]), 'M/d/yyyy'));
            $('#' + itemId + '-approvedDate').val($filter('date')(generateDate(handleObj["Approved Date"]), 'M/d/yyyy'));
          }


          // neu la admin thi update them 4 fields
          if (vm.isAdmin) {
            let CountyNameCode = getCountyNameCode(handleObj["State"], handleObj["County"]);
            Mugshots.update({
              _id: mugshot._id
            }, {
              $set: {
                state: handleObj["State"],
                stateName: getStateName(handleObj["State"]),
                county: CountyNameCode.code,
                countyName: CountyNameCode.name,
                agencyName: handleObj["Agency Name"],
                agencyPerson: handleObj["Agency Person"]
              }
            });
          }

          toastr.success("Mugshot updated!");
        } else { // khong tim thay thi insert
          // nameLength lowCase
          let nameLength = parseInt(fileName.substr(0, fileName.lastIndexOf("."))) || Infinity;
          let mugshotId = Mugshots.insert({
            // state: handleObj["State"],
            // stateName: getStateName(handleObj["State"]),
            // county: getCountyNameCode(handleObj["State"], handleObj["County"]).code,
            // countyName: getCountyNameCode(handleObj["State"], handleObj["County"]).name,
            // agencyPerson: handleObj["Agency Person"],
            // approvedAt: generateDate(handleObj["Approved Date"]),
            // agencyName: handleObj["Agency Name"],
            state: Meteor.user().profile.state,
            stateName: Meteor.user().profile.stateName,
            county: Meteor.user().profile.county,
            countyName: Meteor.user().profile.countyName,
            agencyName: Meteor.user().profile.agency,
            agencyPerson: Meteor.user().profile.name,
            name: handleObj["Name"],
            sex: handleObj["Sex"],
            race: handleObj["Race"],
            dob: generateDate(handleObj["DOB"]),
            stateOfBirth: handleObj["State of Birth"],
            cityOfBirth: handleObj["City of Birth"],
            bookedDate: generateDate(handleObj["Booked Date"]),
            releasedDate: generateDate(handleObj["Released Date"]),
            chargeDescription: handleObj["Charge Description"],
            fileName: handleObj["Image Filename"],
            file: null,
            fileThumb: null,
            fileOriginal: null,
            status: 'pending',
            owner: Meteor.userId(),
            approvedAt: generateDate(handleObj["Approved Date"]),
            updatedAt: new Date(),
            createdAt: new Date(),
            singlePurchase: 0,
            nameLength: nameLength,
            lowerName: fileName.toLowerCase()
          });
          // neu la admin thi update them 4 fields
          if (vm.isAdmin) {
            let CountyNameCode = getCountyNameCode(handleObj["State"], handleObj["County"]);
            Mugshots.update({
              _id: mugshotId
            }, {
              $set: {
                state: handleObj["State"],
                stateName: getStateName(handleObj["State"]),
                county: CountyNameCode.code,
                countyName: CountyNameCode.name,
                agencyName: handleObj["Agency Name"],
                agencyPerson: handleObj["Agency Person"]
              }
            });
          }
          toastr.success("Mugshot created without image!");
        }
      }
      hideModal();
    }
  }

  // hide modal
  function hideModal() {
    let loaded = true;
    $('.item-img').each(function() {
      if ($(this).attr('src') == "/img/loading.gif") {
        loaded = false;
      }
    });
    if (loaded) {
      $('progress-modal').each(function() {
        $('#progress-pane-uploading').hide();
        $('#progress-pane-success').show();
        $('#progress-pane-success').addClass('fadeIn').delay(500).queue(function() {
          $(this).removeClass("fadeIn").dequeue();
          $(this).addClass("bounceOutUp").delay(500).queue(function() {
            $('progress-modal').remove().dequeue();
          }).dequeue();
        });
      });
    }
  }

  function generateDate(string) {
    if (string) {
      let str = string;
      if (string.indexOf(' ') >= 0) {
        str = string.substr(0, string.indexOf(" "));
      }
      let arr = [];
      // if use /
      if (str.indexOf("/") >= 0) {
        for (let i = 0; i < 2; i++) {
          arr[i] = parseInt(str.substr(0, str.indexOf("/")));
          str = str.substr(str.indexOf('/') + 1);
        }
      }
      // if use -
      if (str.indexOf("-") >= 0) {
        for (let i = 0; i < 2; i++) {
          arr[i] = parseInt(str.substr(0, str.indexOf("-")));
          str = str.substr(str.indexOf('-') + 1);
        }
      }
      arr[2] = parseInt(str);
      return new Date(arr[2], arr[0] - 1, arr[1]);
    }
    return "";
  }

  function handleImg(file, fileName) {
    insertAttachment(file, fileName);
    // show modal
    if ($('progress-modal').length == 0) {
      $('body').append($compile("<progress-modal />")($scope));
    }
  }

  function insertAttachment(file, fileName) {
    // let reader = new FileReader();
    // reader.readAsDataURL(file);
    // reader.onload = function(e) {
    //   let binaryData = convertDataURIToBinary(reader.result);
    //   console.log(binaryData);
    //   $timeout(function() {
    //     Meteor.call("uploadToS3", binaryData, function(error, result) {
    //       if (!error) {
    //         console.log(result);
    //       } else {
    //         console.log(error);
    //       }
    //     });
    //   }, 0);
    // };

    // only upload
    S3.upload({
      file: file,
      path: "original/attachments",
      acl: "private"
    }, function(error, result) {
      if (error) {
        console.log("upload original error", error);
      } else {
        let originalObj = result; // assign original file
        // update mugshot
        let mugshot = Mugshots.findOne({
          fileName: originalObj.file.original_name,
          status: "pending",
          owner: Meteor.userId()
        });
        if (mugshot) {
          if (mugshot.file !== null) { // neu co attachment
            // xoa attachment cu
            let keyObjectArr = [];
            if (mugshot.file) { // xoa file
              let s3FileKey = mugshot.file.relative_url.substr(1);
              keyObjectArr.push({
                Key: s3FileKey
              });
            }
            if (mugshot.fileOriginal) { // xoa file
              let s3FileKey = mugshot.fileOriginal.relative_url.substr(1);
              keyObjectArr.push({
                Key: s3FileKey
              });
            }
            if (mugshot.fileThumb) { // xoa file
              let s3FileKeyThumb = mugshot.fileThumb.relative_url.substr(1);
              keyObjectArr.push({
                Key: s3FileKeyThumb
              });
            }
            Meteor.call('deleteS3Objects', keyObjectArr);
          }
          let itemId = mugshot._id,
              updateAttributes = {
                fileOriginal: originalObj
              };
          if ($('#row-' + itemId).length > 0) {
            updateAttributes = {
              fileOriginal: originalObj,
              name: $('#' + itemId + '-name').val(),
              sex: $('#' + itemId + '-sex').val(),
              race: $('#' + itemId + '-race').val(),
              dob: generateDate($('#' + itemId + '-dob').val()),
              stateOfBirth: $('#' + itemId + '-stateOfBirth').val(),
              cityOfBirth: $('#' + itemId + '-cityOfBirth').val(),
              bookedDate: generateDate($('#' + itemId + '-bookedDate').val()),
              releasedDate: generateDate($('#' + itemId + '-releasedDate').val()),
              agencyName: $('#' + itemId + '-agencyName').val(),
              agencyPerson: $('#' + itemId + '-agencyPerson').val(),
              state: $('#' + itemId + '-state').val(),
              stateName: $('#' + itemId + '-state :selected').text(),
              county: $('#' + itemId + '-county').val(),
              countyName: $('#' + itemId + '-county :selected').text(),
              chargeDescription: $('#' + itemId + '-chargeDescription').val(),
            }
          }
          Mugshots.update( // update attachment
            {
              _id: itemId
            }, {
              $set: updateAttributes
            });
          toastr.warning("Some Mugshots have the same filename. They were replaced with new images.");
        } else { // khong co thi insert attachment
          // nameLength lowCase
          let nameLength = parseInt(fileName.substr(0, fileName.lastIndexOf("."))) || Infinity;
          // insert mugshot
          Mugshots.insert({
            state: Meteor.user().profile.state,
            stateName: Meteor.user().profile.stateName,
            county: Meteor.user().profile.county,
            countyName: Meteor.user().profile.countyName,
            agencyName: Meteor.user().profile.agency,
            agencyPerson: Meteor.user().profile.name,
            name: '',
            sex: '',
            race: '',
            dob: '',
            stateOfBirth: '',
            cityOfBirth: '',
            bookedDate: '',
            releasedDate: '',
            chargeDescription: '',
            file: null,
            fileThumb: null,
            fileOriginal: originalObj,
            fileName: fileName,
            status: 'pending',
            owner: Meteor.userId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            approvedAt: new Date(),
            singlePurchase: 0,
            nameLength: nameLength,
            lowerName: fileName.toLowerCase()
          });
        }
        vm.curNumberFile++;
        console.log(vm.curNumberFile, vm.numberFiles);
        // check hide modal
        if (vm.curNumberFile == vm.numberFiles) {
          console.log("hide modal");
          $timeout(function() {
            // hide modal
            hideModal();
          }, 1000 * 5);
        }
      }
    });

    // $timeout(function() {
    //   Meteor.call("uploadToS3", function(error, result) {
    //     if (!error) {
    //       console.log(result);
    //     } else {
    //       console.log(error);
    //     }
    //   });
    // }, 0);

    // // process ALL on client
    // // resize thumbnail
    // let canvas = document.createElement("canvas");
    // let img = new Image,
    //   wama = new Image;
    // img.src = URL.createObjectURL(file);
    // wama.src = "./img/mr-mugshot-watermark-dark.png";
    // img.onload = function() {
    //   // watermark
    //   // get propertive
    //   let hS = img.height,
    //     wS = img.width,
    //     hW = wama.height,
    //     wW = wama.width;
    //   // tinh chieu cao
    //   let newWaw = wS / 3,
    //     newWah = newWaw * hW / wW;
    //   let y = 20,
    //     x = wS - newWaw - y; // 30 --> padding 30px
    //   canvas.height = hS;
    //   canvas.width = wS;
    //   let ctx = canvas.getContext("2d");
    //   ctx.drawImage(img, 0, 0);
    //   ctx.drawImage(wama, x, y, newWaw, newWah);
    //   // create file from canvas
    //   let imgData = canvas.toDataURL("image/jpeg", 0.8);
    //   let binaryData = convertDataURIToBinary(imgData);
    //   let blobData = new Blob([binaryData], {});
    //   let fw = new File([blobData], fileName, { type: "image/*" }); // tao file
    //   // create thumbnail
    //   let imgW = new Image;
    //   imgW.src = URL.createObjectURL(fw);
    //   imgW.onload = function() {
    //     var MAX_WIDTH = 192;
    //     var MAX_HEIGHT = 256;
    //     var width = imgW.width;
    //     var height = imgW.height;
    //     if (width > height) {
    //       if (width > MAX_WIDTH) {
    //         height *= MAX_WIDTH / width;
    //         width = MAX_WIDTH;
    //       }
    //     } else {
    //       if (height > MAX_HEIGHT) {
    //         width *= MAX_HEIGHT / height;
    //         height = MAX_HEIGHT;
    //       }
    //     }
    //     canvas.width = width;
    //     canvas.height = height;
    //     ctx = canvas.getContext("2d");
    //     ctx.drawImage(imgW, 0, 0, width, height);
    //     // create file from canvas
    //     imgData = canvas.toDataURL("image/jpeg", 0.8);
    //     binaryData = convertDataURIToBinary(imgData);
    //     blobData = new Blob([binaryData], {});
    //     let file_thumb = new File([blobData], fileName, {
    //       type: "image/*"
    //     });
    //     // console.log(file);
    //     // console.log(fw);
    //     // console.log(file_thumb);
    //     // upload original
    //     S3.upload({
    //       file: file,
    //       path: "original/attachments",
    //       acl: "private"
    //     }, function(error, result) {
    //       if (error) {
    //         console.log("upload original error", error);
    //       } else {
    //         let originalObj = result; // assign original file
    //         S3.upload({
    //           file: fw,
    //           path: "watermark/attachments",
    //           acl: "private"
    //         }, function(error, result1) {
    //           if (error) {
    //             console.log("upload watermark error", error);
    //           } else {
    //             let watermarkObj = result1; // assign original file
    //             // upload thumbnail
    //             S3.upload({
    //               file: file_thumb,
    //               path: "thumb/attachments",
    //               acl: "private"
    //             }, function(error, result2) {
    //               if (error) {
    //                 console.log("upload thumbnail error", error);
    //               } else {
    //                 let thumbnailObj = result2; // assign thumbnail file
    //                 // update mugshot
    //                 let mugshot = Mugshots.findOne({
    //                   fileName: originalObj.file.original_name,
    //                   status: "pending",
    //                   owner: Meteor.userId()
    //                 });
    //                 if (mugshot) {
    //                   if (mugshot.file !== null) { // neu co attachment
    //                     // xoa attachment cu
    //                     let keyObjectArr = [];
    //                     if (mugshot.file) { // xoa file
    //                       let s3FileKey = mugshot.file.relative_url.substr(1);
    //                       keyObjectArr.push({
    //                         Key: s3FileKey
    //                       });
    //                     }
    //                     if (mugshot.fileOriginal) { // xoa file
    //                       let s3FileKey = mugshot.fileOriginal.relative_url.substr(1);
    //                       keyObjectArr.push({
    //                         Key: s3FileKey
    //                       });
    //                     }
    //                     if (mugshot.fileThumb) { // xoa file
    //                       let s3FileKeyThumb = mugshot.fileThumb.relative_url.substr(1);
    //                       keyObjectArr.push({
    //                         Key: s3FileKeyThumb
    //                       });
    //                     }
    //                     Meteor.call('deleteS3Objects', keyObjectArr);
    //                   }
    //                   Mugshots.update( // update attachment
    //                     {
    //                       _id: mugshot._id
    //                     }, {
    //                       $set: {
    //                         file: watermarkObj,
    //                         fileThumb: thumbnailObj,
    //                         fileOriginal: originalObj
    //                       }
    //                     });
    //                   toastr.warning("Some Mugshots have the same filename. They were replaced with new images.");
    //                 } else { // khong co thi insert attachment
    //                   // nameLength lowCase
    //                   let nameLength = parseInt(fileName.substr(0, fileName.lastIndexOf("."))) || Infinity;
    //                   // insert mugshot
    //                   Mugshots.insert({
    //                     state: Meteor.user().profile.state,
    //                     stateName: Meteor.user().profile.stateName,
    //                     county: Meteor.user().profile.county,
    //                     countyName: Meteor.user().profile.countyName,
    //                     agencyName: Meteor.user().profile.agency,
    //                     agencyPerson: Meteor.user().profile.name,
    //                     name: '',
    //                     sex: '',
    //                     race: '',
    //                     dob: '',
    //                     stateOfBirth: '',
    //                     cityOfBirth: '',
    //                     bookedDate: '',
    //                     releasedDate: '',
    //                     chargeDescription: '',
    //                     file: watermarkObj,
    //                     fileThumb: thumbnailObj,
    //                     fileOriginal: originalObj,
    //                     fileName: fileName,
    //                     status: 'pending',
    //                     owner: Meteor.userId(),
    //                     createdAt: new Date(),
    //                     updatedAt: new Date(),
    //                     approvedAt: new Date(),
    //                     singlePurchase: 0,
    //                     nameLength: nameLength,
    //                     lowerName: fileName.toLowerCase()
    //                   });
    //                 }
    //                 vm.curNumberFile++;
    //                 console.log(vm.curNumberFile, vm.numberFiles);
    //                 // free RAM
    //                 delete blobData;
    //                 img.src = '';
    //                 imgW.src = '';
    //                 canvas.remove();
    //                 delete imgData;
    //                 delete binaryData;
    //                 delete file;
    //                 delete file_thumb;
    //                 delete fw;
    //                 // check hide modal
    //                 if (vm.curNumberFile == vm.numberFiles) {
    //                   console.log("hide modal");
    //                   $timeout(function() {
    //                     // hide modal
    //                     hideModal();
    //                   }, 1000 * 5);
    //                 }
    //               }
    //             });
    //           }
    //         });
    //       }
    //     });
    //   };
    // };
  };

  function checkLoadedImg() { // kiem tra xem tren view da co url het chua
    $('.item-img').each(function() {
      if ($(this).attr('src') == "/img/loading.gif") {
        return false;
      }
    });
    return true;
  }


  let stateList = [{
    name: 'ALABAMA',
    abbreviation: 'AL'
  }, {
    name: 'ALASKA',
    abbreviation: 'AK'
  }, {
    name: 'AMERICAN SAMOA',
    abbreviation: 'AS'
  }, {
    name: 'ARIZONA',
    abbreviation: 'AZ'
  }, {
    name: 'ARKANSAS',
    abbreviation: 'AR'
  }, {
    name: 'CALIFORNIA',
    abbreviation: 'CA'
  }, {
    name: 'COLORADO',
    abbreviation: 'CO'
  }, {
    name: 'CONNECTICUT',
    abbreviation: 'CT'
  }, {
    name: 'DELAWARE',
    abbreviation: 'DE'
  }, {
    name: 'DISTRICT OF COLUMBIA',
    abbreviation: 'DC'
  }, {
    name: 'FEDERATED STATES OF MICRONESIA',
    abbreviation: 'FM'
  }, {
    name: 'FLORIDA',
    abbreviation: 'FL'
  }, {
    name: 'GEORGIA',
    abbreviation: 'GA'
  }, {
    name: 'GUAM',
    abbreviation: 'GU'
  }, {
    name: 'HAWAII',
    abbreviation: 'HI'
  }, {
    name: 'IDAHO',
    abbreviation: 'ID'
  }, {
    name: 'ILLINOIS',
    abbreviation: 'IL'
  }, {
    name: 'INDIANA',
    abbreviation: 'IN'
  }, {
    name: 'IOWA',
    abbreviation: 'IA'
  }, {
    name: 'KANSAS',
    abbreviation: 'KS'
  }, {
    name: 'KENTUCKY',
    abbreviation: 'KY'
  }, {
    name: 'LOUISIANA',
    abbreviation: 'LA'
  }, {
    name: 'MAINE',
    abbreviation: 'ME'
  }, {
    name: 'MARSHALL ISLANDS',
    abbreviation: 'MH'
  }, {
    name: 'MARYLAND',
    abbreviation: 'MD'
  }, {
    name: 'MASSACHUSETTS',
    abbreviation: 'MA'
  }, {
    name: 'MICHIGAN',
    abbreviation: 'MI'
  }, {
    name: 'MINNESOTA',
    abbreviation: 'MN'
  }, {
    name: 'MISSISSIPPI',
    abbreviation: 'MS'
  }, {
    name: 'MISSOURI',
    abbreviation: 'MO'
  }, {
    name: 'MONTANA',
    abbreviation: 'MT'
  }, {
    name: 'NEBRASKA',
    abbreviation: 'NE'
  }, {
    name: 'NEVADA',
    abbreviation: 'NV'
  }, {
    name: 'NEW HAMPSHIRE',
    abbreviation: 'NH'
  }, {
    name: 'NEW JERSEY',
    abbreviation: 'NJ'
  }, {
    name: 'NEW MEXICO',
    abbreviation: 'NM'
  }, {
    name: 'NEW YORK',
    abbreviation: 'NY'
  }, {
    name: 'NORTH CAROLINA',
    abbreviation: 'NC'
  }, {
    name: 'NORTH DAKOTA',
    abbreviation: 'ND'
  }, {
    name: 'NORTHERN MARIANA ISLANDS',
    abbreviation: 'MP'
  }, {
    name: 'OHIO',
    abbreviation: 'OH'
  }, {
    name: 'OKLAHOMA',
    abbreviation: 'OK'
  }, {
    name: 'OREGON',
    abbreviation: 'OR'
  }, {
    name: 'PALAU',
    abbreviation: 'PW'
  }, {
    name: 'PENNSYLVANIA',
    abbreviation: 'PA'
  }, {
    name: 'PUERTO RICO',
    abbreviation: 'PR'
  }, {
    name: 'RHODE ISLAND',
    abbreviation: 'RI'
  }, {
    name: 'SOUTH CAROLINA',
    abbreviation: 'SC'
  }, {
    name: 'SOUTH DAKOTA',
    abbreviation: 'SD'
  }, {
    name: 'TENNESSEE',
    abbreviation: 'TN'
  }, {
    name: 'TEXAS',
    abbreviation: 'TX'
  }, {
    name: 'UTAH',
    abbreviation: 'UT'
  }, {
    name: 'VERMONT',
    abbreviation: 'VT'
  }, {
    name: 'VIRGIN ISLANDS',
    abbreviation: 'VI'
  }, {
    name: 'VIRGINIA',
    abbreviation: 'VA'
  }, {
    name: 'WASHINGTON',
    abbreviation: 'WA'
  }, {
    name: 'WEST VIRGINIA',
    abbreviation: 'WV'
  }, {
    name: 'WISCONSIN',
    abbreviation: 'WI'
  }, {
    name: 'WYOMING',
    abbreviation: 'WY'
  }];
  // init county
  var xmlhttp, text;
  xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', './national_county/national_county.txt', true);
  xmlhttp.send();
  let countyFullList = [];
  xmlhttp.onreadystatechange = function() {
    let text = xmlhttp.responseText;
    if (text) {
      countyFullList = $.csv.toObjects(text);
    }
  };
  // get countyList
  function getCountyList(state) {
    let list = [];
    countyFullList.forEach(function(item, index) {
      if (item.SPostal === state) {
        list.push(item);
      }
    });
    return list;
  };
  // get state name
  function getStateName(stateCode) {
    stateList.forEach(function(item, index) {
      if (item.abbreviation === stateCode) {
        return item.name;
      }
    });
  }
  // check county name
  function getCountyNameCode(stateCode, countyName) {
    let obj = {
      name: "",
      code: ""
    };
    let countyArr = getCountyList(stateCode);
    countyArr.forEach(function(item, index) {
      if (item.CountyName === countyName) {
        obj.name = countyName;
        obj.code = item.SPostal + "-" + item.SFIPS + "-" + item.CFIPS;
        return obj;;
      }
    });
    return obj;
  }
  var BASE64_MARKER = ';base64,';

  function convertDataURIToBinary(dataURI) {
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));
    for (i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }
}
