angular.module('lawdawgs').directive('appReset', function() {
  // Runs during compile
  return {
    restrict: 'EA',
    templateUrl: 'client/components/accounts/reset/reset.html',
    controllerAs: 'resetCtrl',
    controller: ResetController
  };
});


ResetController.$inject = ["$scope", "$reactive", "$state", "$timeout", '$stateParams',  'Flash'];

function ResetController($scope, $reactive, $state, $timeout, $stateParams, Flash) {
  $reactive(this).attach($scope);

  // set condition to view forms

  this.token = $stateParams.token;
  this.newPassword = '';

  this.setNewPassword = setNewPassword;

  this.autorun(() => {
    let user = Meteor.user();
    if (user) {
      if (Roles.userIsInRole(user, 'admin')) {
        $state.go('admin-settings');
      } else {
        $state.go('sheriff-settings');
      }
    }
  })

  function setNewPassword() {
    if (this.newPassword.length < 8) {
      Flash.create("danger", "Password must be at least 8 characters");
      return;
    }

    Accounts.resetPassword(this.token, this.newPassword, function(err) {
      if (!err) {
        Flash.create('success', "The password has been reseted!", '');
        $state.go('settings');
      } else {
        Flash.create('danger', err.reason, '');
      }
    })
  }


  // javascript get and set height to 100%
  var height = isNaN(window.innerHeight) ? window.clientHeight : window.innerHeight;
  $('.full-page-cover').css({ height: height });
}
