angular.module('lawdawgs').directive('sheriffSettings', function() {
  // Runs during compile
  return {
    restrict: 'EA',
    scope: {},
    bindToController: {
      currentUser: '=',
    },
    templateUrl: 'client/components/sheriffs/settings/sheriff-settings.html',
    controllerAs: 'sheriffSetsCtrl',
    controller: SheriffSettingsController
  };
});
SheriffSettingsController.$inject = ["$scope", "$reactive", "$state", 'Flash'];

function SheriffSettingsController($scope, $reactive, $state, Flash) {
  $reactive(this).attach($scope);
  let vm = this;
  this.sheriff = {};
  this.sheriff.agency = Meteor.user().profile.agency;
  this.sheriff.name = Meteor.user().profile.name;
  this.changePassword = changePassword;
  this.changeName = changeName;
  this.firstLogin = false;
  this.autorun(() => {
    if (!Meteor.user()) {
      $state.go("login");
    }
  });

  // subsribe
  this.subscribe('terms-privacy');
  // helpers 
  this.helpers({
    sheriffTerms: () => {
      return TermsPrivacy.findOne({
        type: 'sheriff-terms'
      });
    }
  });
  
  Meteor.call('checkFirstLogin', (err, result) => {
    if (!err) {
      vm.firstLogin = result;
      $scope.$apply();
    } else {
      Flash.create('danger', err.reason, '');
    }
  });

  function changePassword() {
    if (_.isEmpty(this.sheriff)) {
      Flash.create("danger", "Invalid password!");
      return;
    }
    if (this.sheriff.newPassword.length < 8) {
      Flash.create("danger", "Password must be at least 8 characters");
      return;
    }
    if (this.sheriff.newPassword !== this.sheriff.confirmNewPassword) {
      Flash.create("danger", "Confirm password isn't matched!");
      return;
    }
    // change all mugshots's agency name
    let reAgency = this.sheriff.agency;
    let reName = this.sheriff.name;
    Accounts.changePassword(this.sheriff.oldPassword, this.sheriff.newPassword, (err) => {
      if (!err) {
        this.sheriff.oldPassword = "";
        this.sheriff.newPassword = "";
        this.sheriff.confirmNewPassword = "";
        this.sheriff.agency = reAgency;
        this.sheriff.name = reName;
        Flash.create('success', "Changed successfully", '');
      } else {
        console.log(err);
        Flash.create('danger', "Not change, please see log!", '');
      }
    });
  }

  function changeName() {
    Meteor.users.update({
      _id: Meteor.userId()
    }, {
      $set: {
        "profile.agency": this.sheriff.agency,
        "profile.name": this.sheriff.name
      }
    });
    // change all mugshots's agency name
    Meteor.call('changeAgency', Meteor.userId(), Meteor.user().profile.agency, Meteor.user().profile.name);
    Flash.create('success', "Changed successfully", '');
  }
}