angular.module('lawdawgs').directive('userManagement', function() {
  return {
    restrict: 'EA',
    templateUrl: 'client/components/admin/user-management/user-management.html',
    controllerAs: 'userManagementCtrl',
    controller: UserManagementController
  };
});
UserManagementController.$inject = ["$scope", "$reactive", "SweetAlert"];

function UserManagementController($scope, $reactive, SweetAlert) {
  $reactive(this).attach($scope);
  // init
  let vm = this;
  this.pageSizes = [5, 10, 25, 50, 100, 200];
  this.itemsPerPage = 10;
  this.currentPage = 0;
  this.numberPage = [0];
  this.numberUsers = 0;
  this.sortType = '';
  this.sortReverse = false;
  this.selectedType = 'all';
  this.stringType = '';
  this.fromDate = '';
  this.toDate = '';
  this.totalSingle = 0;
  this.totalSubscription = 0;
  this.totalPurchased = 0;
  this.query = '';
  this.options = {};
  setToDate();
  // subscribe
  var subscription;
  this.inSubscription = false;
  this.autorun(() => {
    if (subscription) {
      subscription.stop();
    }
    if (!vm.inSubscription) {
      vm.inSubscription = true;
      setTimeout(function() {
        subscription = vm.subscribe('user_management', () => {
          return [vm.getReactively('options')];
        });
        vm.inSubscription = false;
      }, 500);
    }
    vm.getReactively('options');
  });
  this.subscribe('AllUserCounter', () => {
    return [vm.getReactively('options')];
  });
  this.subscribe('UsersMgtCounter', () => {
    return [vm.getReactively('options')];
  });
  this.autorun(() => {
    vm.currentPage = 0;
    if (this.getReactively('selectedType') === 'purchased') {
      vm.stringType = 'Purchased';
    }
    if (this.getReactively('selectedType') === 'subscribed') {
      vm.stringType = 'Subscribed';
    }
    if (this.getReactively('selectedType') == 'all') {
      vm.stringType = '';
      vm.numberUsers = Counts.get('allUserCounter');
    } else {
      vm.numberUsers = Counts.get('usersMgtCounter');
    }
    // vm.getReactively('users');
    $('.input-group.date').datepicker({
      format: "m/d/yyyy"
    });
  });
  this.autorun(() => {
    if (vm.getReactively('users')) {
      if (vm.users.length == 0) {
        setTimeout(function() {
          vm.inSubscription = false;
        }, 5000);
      }
    }
  });
  this.helpers({
    users: () => {
      let sortQuery = {};
      let type = 'lastLogin';
      let reverse = -1;
      if (vm.getReactively('sortType')) {
        type = vm.sortType.toString();
      }
      if (vm.getReactively('sortReverse')) {
        reverse = 1;
      }
      sortQuery[type] = reverse;
      return Meteor.users.find({
        _id: {
          $ne: Meteor.userId()
        }
      }, {
        sort: sortQuery
      });
    }
  });
  this.autorun(() => {
    this.options = {
      itemsPerPage: vm.getReactively('itemsPerPage'),
      currentPage: vm.getReactively('currentPage'),
      sortType: vm.getReactively('sortType'),
      query: vm.getReactively('query'),
      sortReverse: vm.getReactively('sortReverse'),
      fromDate: vm.getReactively('fromDate'),
      toDate: vm.getReactively('toDate'),
      selectedType: vm.getReactively('selectedType')
    };
  });
  this.autorun(() => {
    // get total
    Meteor.call('getTotalSingle', (error, result) => {
      if (!error) {
        vm.totalSingle = result;
      }
    });
    Meteor.call('getTotalSubscription', (error, result) => {
      if (!error) {
        vm.totalSubscription = result;
      }
    });
    Meteor.call('getTotalPurchased', (error, result) => {
      if (!error) {
        vm.totalPurchased = result;
      }
    });
    this.getReactively('users');
  });
  // generate numberPage
  this.autorun(() => {
    let pages = Math.ceil(this.numberUsers / this.itemsPerPage);
    this.numberPage = [];
    for (let i = 0; i < pages; i++) {
      this.numberPage.push(i);
    }
    if (this.currentPage > pages) {
      this.currentPage = Math.max(...this.numberPage);
    }
    this.getReactively('numberUsers');
    this.getReactively('itemsPerPage');
  });
  // paging function
  this.prevPage = () => {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  };
  this.nextPage = () => {
    if (this.currentPage < this.numberPage.length - 1) {
      this.currentPage++;
    }
  };
  // set disable or enable mugshot
  this.setTogleAction = (user) => {
    let action = 'enable';
    if ((user.action === undefined) || (user.action === "enable")) {
      action = 'disable';
    }
    SweetAlert.swal({
      title: "Are you sure?",
      text: "Are you sure to " + action.toUpperCase() + " this user!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes"
    }, function(isConfirm) {
      if (isConfirm) {
        let params = {
          userId: user._id,
          action: action
        }
        Meteor.call('setTogleActionUser', params);
      }
    });
  };
  // delete user
  this.deleteUser = (userId) => {
    SweetAlert.swal({
      title: "Are you sure?",
      text: "You will not be able to recover this user!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!"
    }, function(isConfirm) {
      if (isConfirm) {
        Meteor.call('removeUserById', userId);
        closeModal();
      }
    });
  };
  this.getEmail = function(user) {
    let currUser = user;
    let currEmail = (currUser.emails && currUser.emails[0].address) || (currUser.services.facebook && (currUser.services.facebook.email || currUser.services.facebook.id)) || (currUser.services.google && currUser.services.google.email);
    if (_.isEmpty(user.email)) {
      Meteor.call('setEmail', user._id);
    }
    return currEmail;
  };
  this.getPicture = function(user) {
    let currUser = user;
    let currPicture = (currUser.services.facebook && currUser.services.facebook.picture) || (currUser.services.google && currUser.services.google.picture) || 'img/No_Image.jpg';
    return currPicture;
  }

  function setToDate() {
    let d = new Date();
    let month = d.getMonth() + 1;
    let year = d.getFullYear();
    vm.fromDate = month + "/1/" + year;
  }
  $('.input-group.date').datepicker({
    format: "m/d/yyyy"
  });
}
