
angular.module('lawdawgs').directive('appTopNavbar', function(){
  // Runs during compile
  return {
    restrict: 'EA',
    templateUrl: 'client/components/layouts/top-navbar.html',
    controllerAs: 'topNavCtrl',
    controller: TopNavbarController
  };
});


TopNavbarController.$inject = ["$scope", "$reactive", "$state"];
function TopNavbarController($scope, $reactive, $state) {
  $reactive(this).attach($scope);

}