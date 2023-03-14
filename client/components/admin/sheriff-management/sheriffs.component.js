angular.module('lawdawgs').directive('sheriffManagement', function() {
  // Runs during compile
  return {
    restrict: 'EA',
    templateUrl: 'client/components/admin/sheriff-management/sheriffs.html',
    controllerAs: 'sheriffMgntCtrl',
    controller: SheriffManagementController
  };
});


SheriffManagementController.$inject = ["$scope", "$reactive", "$state", 'Flash', 'SweetAlert', '$q'];

function SheriffManagementController($scope, $reactive, $state, Flash, SweetAlert, $q) {
  $reactive(this).attach($scope);
  // init
  let vm = this;
  this.invitedEmail = '';
  this.sortType = '';
  this.sortReverse = false;

  this.subscribe('sheriffs', () => {
    return [vm.getReactively('options')];
  });

  this.helpers({
    sheriffs: () => {
      let sortQuery = {};
      let type = 'createdAt';
      let reverse = -1;
      if (vm.getReactively('sortType')) {
        type = vm.sortType.toString();
      }
      if (vm.getReactively('sortReverse')) {
        reverse = 1;
      }
      sortQuery[type] = reverse;
      return Meteor.users.find({
        roles: { $in: ['sheriff'] }
      }, {
        sort: sortQuery
      });
    }
  });

  this.autorun(() => {
    this.options = {
      sortType: vm.getReactively('sortType'),
      sortReverse: vm.getReactively('sortReverse')
    };
  });

  this.inviteSheriff = inviteSheriff;
  this.deleteSheriff = deleteSheriff;
  this.hadSubmitted = hadSubmitted;

  function inviteSheriff(isValid) {

    if (!isValid) {
      Flash.create('danger', 'Invalid email', '');
      return;
    }

    this.isSubmiting = true;

    let obj = {};
    obj = {
      email: this.invitedEmail.toLowerCase(),
      agency: this.invitedAgencyName,
      name: this.invitedAgencyPerson,
      state: this.selectedState,
      stateName: $("#stateSheriff option:selected").text(),
      county: this.selectedCounty,
      countyName: $("#countySheriff option:selected").text()
    };

    Meteor.call('inviteSheriff', obj, (err, result) => {
      if (!err) {
        Flash.create('success', "The invited email has been sent", '');
        this.isSubmiting = false;
        this.selectedState = "";
        this.selectedCounty = "";
        this.invitedAgencyName = "";
        this.invitedAgencyPerson = "";
        this.invitedEmail = "";
      } else {
        this.isSubmiting = false;
        Flash.create('danger', err.reason, '');
      }
    });

  }

  function deleteSheriff(sheriffId) {
    SweetAlert.swal({
        title: "Are you sure?",
        text: "This Sheriff will be removed from system!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, delete it!"
      },
      function(isConfirm) {
        if (isConfirm) {
          Meteor.call('deleteSheriff', sheriffId, (err, result) => {
            if (!err) {
              Flash.create('success', "The sheriff has been removed", '');
            } else {
              Flash.create('danger', err.reason, '');
            }
          });
        }
      });
  }

  function hadSubmitted(sheriffId) {
    Meteor.call('checkSubmitted', sheriffId, function(error, result) {
      if (!error) {
        return result;
      } else {
        console.log(error);
      }
    });
  }

  this.stateList = [
    { name: 'ALABAMA', abbreviation: 'AL' },
    { name: 'ALASKA', abbreviation: 'AK' },
    { name: 'AMERICAN SAMOA', abbreviation: 'AS' },
    { name: 'ARIZONA', abbreviation: 'AZ' },
    { name: 'ARKANSAS', abbreviation: 'AR' },
    { name: 'CALIFORNIA', abbreviation: 'CA' },
    { name: 'COLORADO', abbreviation: 'CO' },
    { name: 'CONNECTICUT', abbreviation: 'CT' },
    { name: 'DELAWARE', abbreviation: 'DE' },
    { name: 'DISTRICT OF COLUMBIA', abbreviation: 'DC' },
    { name: 'FEDERATED STATES OF MICRONESIA', abbreviation: 'FM' },
    { name: 'FLORIDA', abbreviation: 'FL' },
    { name: 'GEORGIA', abbreviation: 'GA' },
    { name: 'GUAM', abbreviation: 'GU' },
    { name: 'HAWAII', abbreviation: 'HI' },
    { name: 'IDAHO', abbreviation: 'ID' },
    { name: 'ILLINOIS', abbreviation: 'IL' },
    { name: 'INDIANA', abbreviation: 'IN' },
    { name: 'IOWA', abbreviation: 'IA' },
    { name: 'KANSAS', abbreviation: 'KS' },
    { name: 'KENTUCKY', abbreviation: 'KY' },
    { name: 'LOUISIANA', abbreviation: 'LA' },
    { name: 'MAINE', abbreviation: 'ME' },
    { name: 'MARSHALL ISLANDS', abbreviation: 'MH' },
    { name: 'MARYLAND', abbreviation: 'MD' },
    { name: 'MASSACHUSETTS', abbreviation: 'MA' },
    { name: 'MICHIGAN', abbreviation: 'MI' },
    { name: 'MINNESOTA', abbreviation: 'MN' },
    { name: 'MISSISSIPPI', abbreviation: 'MS' },
    { name: 'MISSOURI', abbreviation: 'MO' },
    { name: 'MONTANA', abbreviation: 'MT' },
    { name: 'NEBRASKA', abbreviation: 'NE' },
    { name: 'NEVADA', abbreviation: 'NV' },
    { name: 'NEW HAMPSHIRE', abbreviation: 'NH' },
    { name: 'NEW JERSEY', abbreviation: 'NJ' },
    { name: 'NEW MEXICO', abbreviation: 'NM' },
    { name: 'NEW YORK', abbreviation: 'NY' },
    { name: 'NORTH CAROLINA', abbreviation: 'NC' },
    { name: 'NORTH DAKOTA', abbreviation: 'ND' },
    { name: 'NORTHERN MARIANA ISLANDS', abbreviation: 'MP' },
    { name: 'OHIO', abbreviation: 'OH' },
    { name: 'OKLAHOMA', abbreviation: 'OK' },
    { name: 'OREGON', abbreviation: 'OR' },
    { name: 'PALAU', abbreviation: 'PW' },
    { name: 'PENNSYLVANIA', abbreviation: 'PA' },
    { name: 'PUERTO RICO', abbreviation: 'PR' },
    { name: 'RHODE ISLAND', abbreviation: 'RI' },
    { name: 'SOUTH CAROLINA', abbreviation: 'SC' },
    { name: 'SOUTH DAKOTA', abbreviation: 'SD' },
    { name: 'TENNESSEE', abbreviation: 'TN' },
    { name: 'TEXAS', abbreviation: 'TX' },
    { name: 'UTAH', abbreviation: 'UT' },
    { name: 'VERMONT', abbreviation: 'VT' },
    { name: 'VIRGIN ISLANDS', abbreviation: 'VI' },
    { name: 'VIRGINIA', abbreviation: 'VA' },
    { name: 'WASHINGTON', abbreviation: 'WA' },
    { name: 'WEST VIRGINIA', abbreviation: 'WV' },
    { name: 'WISCONSIN', abbreviation: 'WI' },
    { name: 'WYOMING', abbreviation: 'WY' }
  ];

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

}
