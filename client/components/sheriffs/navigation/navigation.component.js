angular.module('lawdawgs').directive('sheriffNavigation', function() {
  return {
    restrict: 'EA',
    templateUrl: 'client/components/sheriffs/navigation/menu.html',
    controllerAs: 'shffNavCtrl',
    controller: SheriffNavigationController
  };
});

SheriffNavigationController.$inject = ["$scope", "$reactive"];

function SheriffNavigationController($scope, $reactive) {
  $reactive(this).attach($scope);
  let vm = this;

  // subscribe
  this.currentUser = Meteor.user();
  this.isAdmin = Roles.userIsInRole(this.currentUser, 'admin');




  this.avatarLink = function () {
    if (Roles.userIsInRole(this.currentUser, 'admin')) {
      return "/img/avatarAdmin.png";
    }
    return "";
  };

  toastr.options.preventDuplicates = true;
}
