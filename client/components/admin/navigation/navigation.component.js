angular.module('lawdawgs').directive('adminNavigation', function() {
  return {
    restrict: 'EA',
    templateUrl: 'client/components/admin/navigation/menu.html',
    controllerAs: 'adminNavCtrl',
    controller: AdminNavigationController
  };
});

AdminNavigationController.$inject = ["$scope", "$reactive"];

function AdminNavigationController($scope, $reactive) {
  $reactive(this).attach($scope);
  let vm = this;

  // subscribe
  this.subscribe('recordCounter');

  this.autorun(() => {
    this.numberPending = Counts.get('numberCounter');
  });


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
