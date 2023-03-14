angular.module('lawdawgs').directive('appFooter', function() {
  return {
    templateUrl: 'client/components/layouts/footer.html',
    controllerAs: 'appFooterCtrl',
    controller: AppFooterController
  };
});
AppFooterController.$inject = ["$scope", "$reactive"];

function AppFooterController($scope, $reactive) {
  $reactive(this).attach($scope);
  let vm = this;
}