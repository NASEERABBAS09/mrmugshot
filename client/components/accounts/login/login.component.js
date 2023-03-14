angular.module('lawdawgs').directive('appLogin', function() {
  // Runs during compile
  return {
    restrict: 'EA',
    templateUrl: 'client/components/accounts/login/login.html',
    controllerAs: 'loginCtrl',
    controller: LoginController
  };
});


LoginController.$inject = ["$scope", "$reactive", "$state", "$timeout", 'Flash'];

function LoginController($scope, $reactive, $state, $timeout, Flash) {
  $reactive(this).attach($scope);
  let vm = this;

  // set condition to view forms
  this.user = {};
  this.loginForm = 'login';

  this.viewLogin = viewLogin;
  this.viewReset = viewReset;

  this.userLogin = userLogin;
  this.resetPassword = resetPassword;
  this.errorMessage = "";

  function viewLogin() {
    vm.user = {};
    vm.loginForm = 'login';
  };

  function viewReset() {
    vm.user = {};
    vm.loginForm = 'reset';
  };

  // event submit on forms
  function userLogin() {
    // login with email password
    Meteor.loginWithPassword(vm.user.email, vm.user.password, (err) => {
      if (!err) {
        vm.errorMessage = "";
        swal({
          title: "Success!",
          text: "Login Successfully!",
          showConfirmButton: false,
          timer: 1000
        });
        vm.loginForm = 'login';
        vm.user = {};
        $timeout(function() {
          if (Roles.userIsInRole(Meteor.user(), 'admin')) {
            $state.go('admin-settings');
          } else {
            $state.go('sheriff-settings');
          }
        }, 100);
      } else {
        vm.errorMessage = "Invalid Email or Password! Please try again, thanks!";
        // Flash.create('danger', "Invalid Email or Password!", 'error');
      }
    });
  };

  function resetPassword(isValid) {
    if (!isValid) {
      Flash.create('danger', 'Invalid email', '');
      return;
    }

    let email = vm.user.email;
    vm.user = {};
    vm.isSubmiting = true;

    Meteor.call('sendResetPassword', email, (err, result) => {
      if (!err) {
        Flash.create('success', "Reset password email has been sent!", '');
        vm.viewLogin();
        vm.isSubmiting = false;
      } else {
        Flash.create('danger', err.reason, '');
        vm.isSubmiting = false;
      }
    });
  }


  // javascript get and set height to 100%
  var height = isNaN(window.innerHeight) ? window.clientHeight : window.innerHeight;
  $('.full-page-cover').css({ height: height });
}
