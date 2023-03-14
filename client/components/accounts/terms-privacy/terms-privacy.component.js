angular.module('lawdawgs').directive('appTermsPrivacy', function() {
  // Runs during compile
  return {
    restrict: 'EA',
    scope: {},
    bindToController: {
      firstLogin: '=',
      sheriffTerms: '='
    },
    templateUrl: 'client/components/accounts/terms-privacy/terms-privacy.html',
    controllerAs: 'termsPrivacyCtrl',
    controller: TermsPrivacyController
  };
});
TermsPrivacyController.$inject = ["$scope", "$reactive", "$sce"];

function TermsPrivacyController($scope, $reactive, $sce) {
  $reactive(this).attach($scope);
  let vm = this;
  this.accept = accept;
  this.trustedContent;

  this.autorun(() => {
    if (vm.getReactively('sheriffTerms')) {
      vm.trustedContent = $sce.trustAsHtml(vm.sheriffTerms.content);
    }
  });

  function accept() {
    Meteor.call('setFirstLogin');
    this.firstLogin = false;
  }
  // javascript get and set height to 100%
  var height = isNaN(window.innerHeight) ? window.clientHeight : window.innerHeight;
  $('.full-page-cover').css({
    height: height
  });
}
