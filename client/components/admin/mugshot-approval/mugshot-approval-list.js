angular.module('lawdawgs').directive('mugshotApprovalList', function() {
  return {
    restrict: 'EA',
    templateUrl: 'client/components/admin/mugshot-approval/mugshot-approval-list.html',
    controllerAs: 'mugshotsApprovalCtrl',
    controller: MugshotsApprovalController
  };
});

angular.module('lawdawgs').directive('mugshotApprovalDetail', function() {
  return {
    restrict: 'EA',
    templateUrl: 'client/components/admin/mugshot-approval/mugshot-approval-detail.html',
    controllerAs: 'mugshotsApprovalCtrl',
    controller: MugshotsApprovalController
  };
});


MugshotsApprovalController.$inject = ["$scope", "$reactive", "$stateParams", "$state"];

function MugshotsApprovalController($scope, $reactive, $stateParams, $state) {
  $reactive(this).attach($scope);

  this.recordId = '';
  if ($stateParams.id) {
    this.recordId = $stateParams.id;
  }

  // subscribe
  this.subscribe('submitRecordPending');

  this.helpers({
    subRecords: () => {
      return SubmitRecord.find({}, {
        sort: {
          createdAt: -1
        }
      });
    }
  });

}