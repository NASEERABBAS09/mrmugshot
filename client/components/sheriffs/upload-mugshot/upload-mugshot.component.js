angular.module('lawdawgs').directive('uploadMugshot', function() {
  // Runs during compile
  return {
    restrict: 'EA',
    templateUrl: 'client/components/sheriffs/upload-mugshot/upload-mugshot.html',
    controllerAs: 'sheriffUploadCtrl',
    controller: SheriffUploadMugshotController
  };
});


SheriffUploadMugshotController.$inject = ["$scope", "$reactive"];

function SheriffUploadMugshotController($scope, $reactive) {
  $reactive(this).attach($scope);

  // subscribe
  this.subscribe('submitRecordPending');

  this.numberFiles = 0;
}