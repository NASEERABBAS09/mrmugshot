angular.module('lawdawgs').directive('mugshotItems', function() {
  // Runs during compile
  return {
    restrict: 'EA',
    scope: {},
    bindToController: {
      submitId: '@',
      type: '@',
      page: '@',
      numberFiles: '='
    },
    templateUrl: 'client/components/mugshots/mugshots.html',
    controllerAs: 'mugshotItemsCtrl',
    controller: MugshotItemsController
  };
});
MugshotItemsController.$inject = ["$scope", "$reactive", "$state", "SweetAlert", "$stateParams", "$filter", "$q", "$compile"];

function MugshotItemsController($scope, $reactive, $state, SweetAlert, $stateParams, $filter, $q, $compile) {
  $reactive(this).attach($scope);
  let vm = this;
  this.subscribe('type_mugshots', () => {
    return [this.getReactively('type')];
  }, {
    onReady: function() {
      console.log("onReady And the Items actually Arrive");
      // hide modal
      hideModal();
    }
  });

  let pageType = this.page;
  let recordId = $stateParams.id;
  this.deleteFile = deleteFile;
  this.approve = approve;
  this.submit = submit;
  this.getUrl = getUrl;
  this.checkPage = checkPage;
  this.checkValid = checkValid;
  this.countUrl = 0;
  this.checkValidItem = checkValidItem;
  this.checkValidApproveItem = checkValidApproveItem;
  this.getCountyList = getCountyList;
  this.agencyNameList = [];
  this.agencyPersonList = [];
  this.mugshotList = [];
  this.mugshotURL = "";
  this.currScroll = 1;
  this.checkValidSubmitItem = checkValidSubmitItem;
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
      if (this.type == 'submitted') { // neu la mugshot approval
        return Mugshots.find({
          submitId: this.getReactively("submitId"),
          status: this.getReactively("type")
        }, {
          sort: {
            nameLength: 1,
            lowerName: 1,
            createdAt: 1
          }
        });
      } else { // neu la upload mugshot
        return Mugshots.find({
          status: this.getReactively("type"),
          owner: Meteor.userId()
        }, {
          sort: {
            nameLength: 1,
            lowerName: 1,
            createdAt: 1
          }
        })
      }
    }
  });
  this.autorun(() => {
    $('.input-group.date').datepicker({
      format: "m/d/yyyy"
    });
    this.getReactively('mugshots');
  });
  // get acency list
  Meteor.call('getAgency', function(error, result) {
    if (error) {
      console.log('failed', error);
    } else {
      vm.agencyNameList = result.agencyName;
      vm.agencyPersonList = result.agencyPerson;
      $scope.$apply();
    }
  });

  firstLoad();

  this.loadMore = function() {
    vm.currScroll++;
  };

  function deleteFile(mugshot) {
    SweetAlert.swal({
      title: "Are you sure?",
      text: "You will not be able to recover this file!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!"
    }, function(isConfirm) {
      if (isConfirm) {
        Meteor.call('removeMugshotByAttId', mugshot._id); // xoa mugshot
        // if pageType === 'approve' --> countDown
        if (pageType === 'approve') {
          Meteor.call('countDownSubmitRecord', recordId, function(error, result) {
            if (error) {
              console.log('failed', error);
            } else {
              if (result === 'zero') {
                // setTimeout(function() { window.location = "./mugshot-approval"; }, 200);
                setTimeout(function() { $state.transitionTo('mugshot-approval-list'); }, 200);
              }
            }
          });
        }
      }
    });
  }


  function approve(itemId) {
    SweetAlert.swal({
      title: "Are you sure?",
      text: "When you approve, you will not able to undo!!! \nMugshot with empty content or without photo CANNOT be APPROVED!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, approve it!!"
    }, function(isConfirm) {
      if (isConfirm) {
        // Meteor.call('approveMugshotByAttId', itemId);
        let approvedDate = new Date();
        if (!_.isEmpty($('#' + itemId + '-approvedDate').val())) {
          approvedDate = generateDate($('#' + itemId + '-approvedDate').val());
        }
        Mugshots.update({
          _id: itemId
        }, {
          $set: {
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
            // status: "approved",
            updatedAt: new Date(),
            approvedAt: approvedDate
            // action: "enable"
          }
        }, function() {
          Meteor.call('approveMugshotByAttId', itemId);
        });

        // update State County
        Meteor.call('updateStateCountyList', itemId);
        // if pageType === 'approve' --> countDown
        if (pageType === 'approve') {
          Meteor.call('countDownSubmitRecord', recordId, function(error, result) {
            if (error) {
              console.log('failed', error);
            } else {
              if (result === 'zero') {
                // setTimeout(function() { window.location = "./mugshot-approval"; }, 200);
                setTimeout(function() { $state.transitionTo('mugshot-approval-list'); }, 200);
              }
            }
          });
        }
      }
    });
  }

  function submit (itemId){
    SweetAlert.swal({
      title: "Are you sure?",
      text: "When you submit, you will not able to undo!!! \nMugshot with empty content or without photo CANNOT be SUBMITTED!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, submit it!!"
    }, function(isConfirm) {
      if (isConfirm) {
        let approvedDate = new Date();
        if (!_.isEmpty($('#' + itemId + '-approvedDate').val())) {
          approvedDate = generateDate($('#' + itemId + '-approvedDate').val());
        }
        // save mugshot data
        Mugshots.update({
          _id: itemId
        }, {
          $set: {
            name: $('#' + itemId + '-name').val(),
            sex: $('#' + itemId + '-sex').val(),
            race: $('#' + itemId + '-race').val(),
            dob: generateDate($('#' + itemId + '-dob').val()),
            stateOfBirth: $('#' + itemId + '-stateOfBirth').val(),
            cityOfBirth: $('#' + itemId + '-cityOfBirth').val(),
            bookedDate: generateDate($('#' + itemId + '-bookedDate').val()),
            releasedDate: generateDate($('#' + itemId + '-releasedDate').val()),
            chargeDescription: $('#' + itemId + '-chargeDescription').val(),
            updatedAt: new Date(),
            approvedAt: approvedDate
          }
        });
        // neu la admin thi update them 4 fields
        if (vm.isAdmin) {
          Mugshots.update({
            _id: itemId
          }, {
            $set: {
              agencyName: $('#' + itemId + '-agencyName').val(),
              agencyPerson: $('#' + itemId + '-agencyPerson').val(),
              state: $('#' + itemId + '-state').val(),
              stateName: $('#' + itemId + '-state :selected').text(),
              county: $('#' + itemId + '-county').val(),
              countyName: $('#' + itemId + '-county :selected').text()
            }
          });
        }

        // check musghot
        let item = Mugshots.findOne({_id: itemId});
        if (item) {
          if ((item.fileOriginal !== null) && (item.name || item.sex || item.race || item.dob || item.stateOfBirth || item.cityOfBirth || item.bookedDate || item.releasedDate || item.chargeDescription || item.approvedAt)) {
            // insert submit record
            let submitId = SubmitRecord.insert({
              agency: Meteor.user().profile.agency,
              userId: Meteor.userId(),
              userName: Meteor.user().profile.name,
              count: 1,
              createdAt: new Date(),
              status: "pending",
              state: Meteor.user().profile.state,
              county: Meteor.user().profile.county
            });
            // update mugshot status
            Mugshots.update({
              _id: itemId
            }, {
              $set: {
                status: "submitted",
                submitId: submitId
              }
            });
            toastr.success("Mugshot has been submitted!");
          }
          else {
            toastr.warning("Mugshot has invalid data!");
          }
        }
      }
    });
  }

  function generateDate(string) {
    if (string) {
      var str = string;
      if (string.indexOf(' ') >= 0) {
        str = string.substr(0, string.indexOf(" "));
      }
      var arr = [];
      for (var i = 0; i < 2; i++) {
        arr[i] = parseInt(str.substr(0, str.indexOf("/")));
        str = str.substr(str.indexOf('/') + 1);
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
    return new Date();
  }

  function getUrl(mugshot) {
    if ($("#" + mugshot._id + "-img").hasClass("loaded-img")) {
      return;
    } else {
      if (mugshot.fileOriginal !== null) {
        $("#" + mugshot._id + "-img").attr("src", "/img/loading.gif");
        $("#" + mugshot._id + "-img").addClass("loaded-img");
        let s3FileKey = mugshot.fileOriginal.relative_url.substr(1);
        setTimeout(function() {
          Meteor.call("getS3Url", s3FileKey, function(error, result) {
            if (!error) {
              $("#" + mugshot._id + "-img").attr("src", result);
              return;
            } else {
              console.log("error", error);
              return;
            }
          });
        }, 0);
      } else {
        return "/img/No_Image.jpg";
      }
    }

    // if (mugshot.file) {
    //   let s3FileKey = mugshot.file.relative_url.substr(1);
    //   if (ReactiveMethod.call("getS3Url", s3FileKey)) {
    //     return ReactiveMethod.call("getS3Url", s3FileKey);
    //   } else {
    //     return "/img/loading.gif";
    //   }
    // }
    // return "/img/No_Image.jpg";
    // if (mugshot.file) {
    //   if (mugshot.file.url() || mugshot.file.url({
    //       store: 'original'
    //     })) {
    //     if (checkLoadedImg()) {
    //       $('progress-modal').each(function() {
    //         $('#progress-pane-uploading').hide();
    //         $('#progress-pane-success').show();
    //         $('#progress-pane-success').addClass('fadeIn').delay(500).queue(function() {
    //           $(this).removeClass("fadeIn").dequeue();
    //           $(this).addClass("bounceOutUp").delay(500).queue(function() {
    //             $('progress-modal').remove().dequeue();
    //           }).dequeue();
    //         });
    //       });
    //     }
    //     return mugshot.file.url() || mugshot.file.url({
    //       store: 'original'
    //     });
    //   }
    //   return "/img/loading.gif";
    // }
    // return "/img/No_Image.jpg";
  }

  function checkPage() {
    if (this.page == 'approve') {
      return "submit-button";
    } else {
      return "col-md-offset-3";
    }
  }

  function checkValid(itemId, mugshot) {
    if (this.page === 'approve') {
      if ((!checkValidItem(itemId))) {
        $('#' + itemId + '-approveBtn').hide();
        $('#' + itemId + '-deleteBtn').removeClass('submit-button');
        $('#' + itemId + '-deleteBtn').addClass('col-md-offset-3');
      } else {
        $('#' + itemId + '-approveBtn').show();
        $('#' + itemId + '-deleteBtn').addClass('submit-button');
        $('#' + itemId + '-deleteBtn').removeClass('col-md-offset-3');
      }
    }
    if (vm.page === 'upload') {
     if ((!checkValidItem(itemId))) {
        $('#' + itemId + '-submitBtn').hide();
        $('#' + itemId + '-deleteBtn').removeClass('submit-button');
        $('#' + itemId + '-deleteBtn').addClass('col-md-offset-3');
      } else {
        $('#' + itemId + '-submitBtn').show();
        $('#' + itemId + '-deleteBtn').addClass('submit-button');
        $('#' + itemId + '-deleteBtn').removeClass('col-md-offset-3');
      } 
    }
    checkError($('#' + itemId + '-agencyName'));
    checkError($('#' + itemId + '-agencyPerson'));
    checkError($('#' + itemId + '-state'));
    checkError($('#' + itemId + '-county'));
  }

  function checkValidItem(itemId) {
    if (($('#' + itemId + '-img').attr('src') !== '/img/No_Image.jpg') && ($('#' + itemId + '-name').val() || $('#' + itemId + '-sex').val() || $('#' + itemId + '-race').val() || $('#' + itemId + '-dob').val() || $('#' + itemId + '-stateOfBirth').val() || $('#' + itemId + '-cityOfBirth').val() || $('#' + itemId + '-bookedDate').val() || $('#' + itemId + '-releasedDate').val() || $('#' + itemId + '-chargeDescription').val() || $('#' + itemId + '-approvedDate').val())) {
      if ((vm.page === 'approve') || (vm.isAdmin)) {
        if ($('#' + itemId + '-state').val() && $('#' + itemId + '-county').val() && $('#' + itemId + '-agencyName').val() && $('#' + itemId + '-agencyPerson').val()) { // neu la trang approve thi check them 4 fields
          return true;
        }
        else {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  function checkError(selector) {
    if (!selector.val()) {
      selector.parent().addClass("has-error");
    } else {
      selector.parent().removeClass("has-error");
    }
  }

  function checkValidApproveItem(itemId) {
    this.checkValid(itemId);
    return ((this.page === "approve") && (checkValidItem(itemId)));
  }

  function checkValidSubmitItem(itemId) {
    this.checkValid(itemId);
    return ((this.page === "upload") && (checkValidItem(itemId)));
  }

  this.stateList = [{
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

  // first load
  function firstLoad() {
    // show modal
    if ($('progress-modal').length == 0) {
      $('body').append($compile("<progress-modal />")($scope));
    }
    setTimeout(function() {
      // hide modal
      hideModal();
    }, 1000 * 5);
  }
}
