angular.module('lawdawgs').directive('appSheriffTerms', function() {
  // Runs during compile
  return {
    restrict: 'EA',
    templateUrl: 'client/components/sheriffs/sheriff-terms/sheriff-terms.html',
    controllerAs: 'SheriffTermsCtrl',
    controller: SheriffTermsController
  };
});
SheriffTermsController.$inject = ["$scope", "$reactive", "$sce"];

function SheriffTermsController($scope, $reactive, $sce) {
  $reactive(this).attach($scope);
  let vm = this;
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

  this.trustedContent;

  this.autorun(() => {
    if (vm.getReactively('sheriffTerms')) {
      vm.trustedContent = $sce.trustAsHtml(vm.sheriffTerms.content);
    }
  });
}