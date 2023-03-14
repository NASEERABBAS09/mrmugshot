angular.module('lawdawgs').directive('mugshotManagement', function() {
  return {
    restrict: 'EA',
    templateUrl: 'client/components/admin/mugshot-management/mugshot-management.html',
    controllerAs: 'mugshotManagementCtrl',
    controller: MugshotManagementController
  };
});
MugshotManagementController.$inject = ["$scope", "$reactive", "SweetAlert", "$filter"];

function MugshotManagementController($scope, $reactive, SweetAlert, $filter) {
  $reactive(this).attach($scope);
  // init
  let vm = this;
  this.pageSizes = [5, 10, 25, 50, 100, 200];
  this.itemsPerPage = 10;
  this.currentPage = 0;
  this.numberPage = [0];
  this.numberMugshots = 0;
  this.sortType = '';
  this.sortReverse = false;
  this.query = '';
  this.filteredMugshots = [];
  this.selectedState = '';
  this.selectedCounty = '';
  this.uploadFromDate = '';
  this.uploadToDate = '';
  this.currMugshot = {};
  this.currState = '';
  this.currCounty = '';
  this.agencyNameList = [];
  this.agencyPersonList = [];
  // subscribe
  this.subscribe('MugshotsApprovedCounter', () => {
    return [vm.getReactively('options')];
  });

  this.autorun(() => {
    vm.numberMugshots = Counts.get('approvedCounter');
    this.getReactively('mugshots');
  });

  var subscription;
  this.inSubscription = false;
  this.oldState = "";
  this.oldCounty = "";
  this.autorun(() => {
    if (subscription) {
      subscription.stop();
    }
    if (!vm.inSubscription) {
      vm.inSubscription = true;
      setTimeout(function() {
        subscription = vm.subscribe('mugshots_management', () => {
          return [vm.getReactively('options')];
        });
        vm.inSubscription = false;
      }, 500);
    }
    vm.getReactively('options');
  });

  this.helpers({
    mugshots: () => {
      let sortQuery = {};
      let type = 'approvedAt';
      let reverse = -1;
      if (vm.getReactively('sortType')) {
        type = vm.sortType.toString();
      }
      if (vm.getReactively('sortReverse')) {
        reverse = 1;
      }
      sortQuery[type] = reverse;
      return Mugshots.find({}, {
        sort: sortQuery
      });
    },
    attachments: () => {
      return Attachments.find({});
    }
  });

  this.autorun(() => {
    this.options = {
      itemsPerPage: this.getReactively('itemsPerPage'),
      currentPage: this.getReactively('currentPage'),
      sortType: this.getReactively('sortType'),
      sortReverse: this.getReactively('sortReverse'),
      query: this.getReactively('query'),
      selectedState: this.getReactively('selectedState'),
      selectedCounty: this.getReactively('selectedCounty'),
      uploadFromDate: this.getReactively('uploadFromDate'),
      uploadToDate: this.getReactively('uploadToDate')
    };
  });

  this.autorun(() => {
    vm.getReactively('selectedState');
    vm.getReactively('selectedCounty');
    vm.currentPage = 0;
  });

  // generate numberPage and live search
  this.autorun(() => {
    let pages = Math.ceil(this.numberMugshots / this.itemsPerPage);
    if (pages === 0) {
      pages = 1;
    }
    this.numberPage = [];
    for (let i = 0; i < pages; i++) {
      this.numberPage.push(i);
    }
    if (this.currentPage > pages) {
      this.currentPage = Math.max(...this.numberPage);
    }
    this.getReactively('numberMugshots');
    this.getReactively('itemsPerPage');
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

  this.showWaterMark = function(mugshot) {
    return "/img/mr-mugshot-watermark-dark.png";
  };

  this.getUrl = function(mugshot) {
    if (!_.isEmpty(mugshot)) {
      if ($("#" + mugshot._id + "-img").hasClass("loaded-img")) {
        return;
      } else {
        if (mugshot.file !== null) {
          $("#" + mugshot._id + "-img").addClass("loaded-img");
          $("#" + mugshot._id + "-img").attr("src", "/img/loading.gif");
          let s3FileKey = "";
          if (mugshot.file) {
            s3FileKey = mugshot.file.relative_url.substr(1);
          }
          if (mugshot.fileOriginal) {
            s3FileKey = mugshot.fileOriginal.relative_url.substr(1);
          }
          setTimeout(function() {
            Meteor.call("getS3Url", s3FileKey, function(error, result) {
              if (!error) {
                $("#" + mugshot._id + "-img").attr("src", result);
                // remove image on view
                $("#" + mugshot._id + "-img").removeClass("loaded-img");
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
    }
  };

  this.getUrlThumb = function(mugshot) {
    if ($("#" + mugshot._id + "-img-thumb").hasClass("loaded-img")) {
      return;
    } else {
      if (mugshot.file !== null) {
        $("#" + mugshot._id + "-img-thumb").addClass("loaded-img");
        $("#" + mugshot._id + "-img-thumb").attr("src", "/img/loading.gif");
        let s3FileKey = mugshot.fileThumb.relative_url.substr(1);
        setTimeout(function() {
          Meteor.call("getS3Url", s3FileKey, function(error, result) {
            if (!error) {
              $("#" + mugshot._id + "-img-thumb").attr("src", result);
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
  };

  // paging function
  this.prevPage = () => {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  };
  this.nextPage = () => {
    if (this.currentPage < this.numberPage.length - 1) {
      this.currentPage++;
    }
  };
  this.setPage = (n) => {
    this.currentPage = n;
  };
  // set disable or enable mugshot
  this.setTogleAction = (mugshot) => {
    let action = 'enable';
    if (mugshot.action === "enable") {
      action = 'disable';
    }
    SweetAlert.swal({
      title: "Are you sure?",
      text: "Are you sure to " + action.toUpperCase() + " this mugshot!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes"
    }, function(isConfirm) {
      if (isConfirm) {
        Mugshots.update({
          _id: mugshot._id
        }, {
          $set: {
            action: action
          }
        });
      }
    });
  };
  // delete mugshot
  this.deleteMugshot = (mugshotId, fileId) => {
      SweetAlert.swal({
        title: "Are you sure?",
        text: "You will not be able to recover this file!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, delete it!"
      }, function(isConfirm) {
        if (isConfirm) {
          let mugshot = Mugshots.findOne({ _id: mugshotId });
          if (mugshot) {
            let state = mugshot.state;
            let county = mugshot.county;
            Meteor.call('removeMugshotByAttId', mugshotId, function(err, result) {
              if (!err) {
                Meteor.call('deleteStateCountyList', state, county);
              }
            });
          }
          closeModal();
        }
      });
    }
    // set current mugshot
  this.setCurrMugshot = function(mugshot) {
    vm.currMugshot = angular.copy(mugshot);
    vm.currDate = {
      dob: $filter('date')(vm.currMugshot.dob, "M/d/yyyy"),
      bookedDate: $filter('date')(vm.currMugshot.bookedDate, "M/d/yyyy"),
      releasedDate: $filter('date')(vm.currMugshot.releasedDate, "M/d/yyyy"),
      approvedAt: $filter('date')(vm.currMugshot.approvedAt, "M/d/yyyy")
    }
    vm.currState = mugshot.state; // get current state
    vm.currCounty = mugshot.county; // get current state
    // set old state and county
    vm.oldState = mugshot.state;
    vm.oldCounty = mugshot.county;
  }
  this.saveMugshot = (itemId) => {
    SweetAlert.swal({
      title: "Are you sure?",
      text: "Do you want to SAVE this mugshot's detail!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, Save!"
    }, function(isConfirm) {
      if (isConfirm) {
        // kiem tra 4 fields
        if (!$('#' + itemId + '-state').val() || !$('#' + itemId + '-county').val() || !$('#' + itemId + '-agencyName').val() || !$('#' + itemId + '-agencyPerson').val()) {
          toastr.error("State or County or Agency Name or Agency Person is missing!");
        } else {
          // process
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
              approvedAt: approvedDate,
              agencyName: $('#' + itemId + '-agencyName').val(),
              agencyPerson: $('#' + itemId + '-agencyPerson').val(),
              state: $('#' + itemId + '-state').val(),
              stateName: $('#' + itemId + '-state :selected').text(),
              county: $('#' + itemId + '-county').val(),
              countyName: $('#' + itemId + '-county :selected').text(),
              chargeDescription: $('#' + itemId + '-chargeDescription').val(),
              updatedAt: new Date()
            }
          });
          // check change state and county
          if ((vm.oldState != $('#' + itemId + '-state').val()) || (vm.oldCounty != $('#' + itemId + '-county').val())) {
            Meteor.call("deleteStateCountyList", vm.oldState, vm.oldCounty);
            Meteor.call("updateStateCountyList", itemId);
          }
          closeModal();
        }
      }
    });
  };

  function closeModal() {
    //close modal
    $("#modal-mugshot-detail").modal("hide");
  };

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
      arr[2] = parseInt(str);
      return new Date(arr[2], arr[0] - 1, arr[1]);
    }
    return new Date();
  }
  // init state and county list
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

  function loadCounty(state) {
    let list = [];
    countyFullList.forEach(function(item, index) {
      if (item.SPostal === state) {
        list.push(item);
      }
    });
    return list;
  };
  this.autorun(() => {
    this.countyList = loadCounty(this.getReactively('selectedState'));
    this.selectedCounty = '';
  });
  $('.input-group.date').datepicker({
    format: "m/d/yyyy"
  });

  // update current county list
  this.autorun(() => {
    this.currCountyList = loadCounty(this.getReactively('currState'));
  });

  // get countyList
  this.getCountyList = function(state) {
    let list = [];
    countyFullList.forEach(function(item, index) {
      if (item.SPostal === state) {
        list.push(item);
      }
    });
    return list;
  };
}
