angular.module('lawdawgs').directive('submitBtn', function() {
  // Runs during compile
  return {
    restrict: 'EA',
    scope: {},
    bindToController: {
      type: '@',
      submitRecordId: '@',
      mugshots: '='
    },
    templateUrl: 'client/components/mugshots/submit-btn.html',
    controllerAs: 'submitBtnCtrl',
    controller: SubmitButtonController
  };
});

SubmitButtonController.$inject = ["$scope", "$reactive", "$state", 'Flash', 'SweetAlert', '$compile'];

function SubmitButtonController($scope, $reactive, $state, Flash, SweetAlert, $compile) {
  $reactive(this).attach($scope);
  // assign variable
  var vm = this;
  this.currentUser = Meteor.user();
  this.isAdmin = Roles.userIsInRole(this.currentUser, 'admin');
  this.btnName = '';
  let type, submitCallStr, status, setStatus, toastrText, confirmText, recordId;
  let btnType = this.type;
  if (btnType === "upload") { // if the type is upload
    this.btnName = "Submit Mugshots";
    confirmText = {
      title: "Are you sure?",
      text: "When you submitted, you will not able to undo!!! \nMugshot with empty content or without photo CANNOT be SUBMITTED!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, submit mugshots!"
    };
    status = "pending";
    submitCallStr = 'createSubmitRecord';
    setStatus = "submitted";
    toastrText = "Mugshots submitted!";
  }
  if (btnType === "approve") { // if the type is approve
    this.btnName = "Approve Mugshots";
    confirmText = {
      title: "Are you sure?",
      text: "When you approved, you will not able to undo!!! \nMugshot with empty content or without photo CANNOT be APPROVED!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, approve mugshots!"
    };
    submitCallStr = 'removeSubmitRecord';
    setStatus = "approved";
    toastrText = "Mugshots approved!";
    recordId = this.submitRecordId;
  }
  if ((btnType === "deleteAllUpload") || (btnType === "deleteAllApprove")) { // if the type is approve
    this.btnName = "Delete Mugshots";
    confirmText = {
      title: "Are you sure?",
      text: "You will not able to recover these files!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete!"
    };
    toastrText = "Mugshots deleted!";
  }
  this.submitMugshots = function(btnType) {
    SweetAlert.swal(confirmText, function(isConfirm) {
      if (isConfirm) {
        if (btnType === "deleteAllUpload") {
          // show modal
          if ($('progress-modal').length == 0) {
            $('body').append($compile("<progress-modal />")($scope));
          }
          Meteor.call('deleteAllUpload', Meteor.userId(), function(err, result) {
            if (!err) {
              hideModal();
              toastr.success(toastrText);
            } else {
              console.log(err);
            }
          });
        }
        if (btnType === "deleteAllApprove") {
          // show modal
          if ($('progress-modal').length == 0) {
            $('body').append($compile("<progress-modal />")($scope));
          }
          Meteor.call('deleteAllApprove', vm.submitRecordId, function(err, result) {
            if (!err) {
              hideModal();
              toastr.success(toastrText);
              // setTimeout(function() { window.location = "./mugshot-approval"; }, 200);
              setTimeout(function() { $state.transitionTo('mugshot-approval-list'); }, 200);
            } else {
              console.log(err);
            }
          });
        }
        if (btnType === 'approve') {
          let itemId = '';
          $('.mugshot-item').each(function(i, obj) {
            itemId = $(this).data('id'); // get mugshot id
            let approvedDate = new Date();
            if (!_.isEmpty($('#' + itemId + '-approvedDate').val())) {
              approvedDate = generateDate($('#' + itemId + '-approvedDate').val());
            }
            // save data
            Mugshots.update({
              _id: itemId
            }, {
              $set: {
                name: $('#' + itemId + '-name').val(),
                sex: $('#' + itemId + '-sex').val(),
                race: $('#' + itemId + '-race').val(),
                dob: generateDate($('#' + itemId + '-dob').val()),
                stateOfBirth: $('#' + itemId + '-stateOfBirth').val(),
                cityOfBirth: $('#' + itemId + '-cityOfBirth').val(),
                bookedDate: generateDate($('#' + itemId + '-bookedDate').val()),
                releasedDate: generateDate($('#' + itemId + '-releasedDate').val()),
                approvedAt: approvedDate,
                agencyName: $('#' + itemId + '-agencyName').val(),
                agencyPerson: $('#' + itemId + '-agencyPerson').val(),
                state: $('#' + itemId + '-state').val(),
                stateName: $('#' + itemId + '-state :selected').text(),
                county: $('#' + itemId + '-county').val(),
                countyName: $('#' + itemId + '-county :selected').text(),
                chargeDescription: $('#' + itemId + '-chargeDescription').val(),
                updatedAt: new Date()
              }
            });
            toastr.success("Mugshots updated!");
          });
          // call submit methods
          setTimeout(function() {
            Meteor.call('approveMugshots', vm.submitRecordId, function(error, result) {
              if (!error) {
                if (result != 'zero') {
                  toastr.success(result + " mugshots were submitted!");
                }
              } else {
                console.log(error);
              }
            });
            setTimeout(function() { $state.transitionTo('mugshot-approval-list'); }, 1000);
          }, 0);
        }
        if (btnType === 'upload') {
          // save data
          let itemId = '';
          $('.mugshot-item').each(function(i, obj) {
            itemId = $(this).data('id'); // get mugshot id
            let approvedDate = new Date();
            if (!_.isEmpty($('#' + itemId + '-approvedDate').val())) {
              approvedDate = generateDate($('#' + itemId + '-approvedDate').val());
            }
            Mugshots.update({
              _id: itemId
            }, {
              $set: {
                name: $('#' + itemId + '-name').val(),
                sex: $('#' + itemId + '-sex').val(),
                race: $('#' + itemId + '-race').val(),
                dob: generateDate($('#' + itemId + '-dob').val()),
                stateOfBirth: $('#' + itemId + '-stateOfBirth').val(),
                cityOfBirth: $('#' + itemId + '-cityOfBirth').val(),
                bookedDate: generateDate($('#' + itemId + '-bookedDate').val()),
                releasedDate: generateDate($('#' + itemId + '-releasedDate').val()),
                approvedAt: approvedDate,
                chargeDescription: $('#' + itemId + '-chargeDescription').val(),
                updatedAt: new Date()
              }
            });
            // neu la admin thi update them 4 fields
            if (vm.isAdmin) {
              Mugshots.update({
                _id: itemId
              }, {
                $set: {
                  agencyName: $('#' + itemId + '-agencyName').val(),
                  agencyPerson: $('#' + itemId + '-agencyPerson').val(),
                  state: $('#' + itemId + '-state').val(),
                  stateName: $('#' + itemId + '-state :selected').text(),
                  county: $('#' + itemId + '-county').val(),
                  countyName: $('#' + itemId + '-county :selected').text()
                }
              });
            }
            toastr.success("Mugshots updated!");
          });
          // call submit methods
          setTimeout(function() {
            Meteor.call('submitMugshots', function(error, result) {
              if (!error) {
                toastr.success(result + " mugshots were submitted!");
              } else {
                console.log(error);
              }
            });
          }, 0);
        }
      }
    });
  };

  function generateDate(string) {
    if (string) {
      let str = string;
      if (string.indexOf(' ') >= 0) {
        str = string.substr(0, string.indexOf(" "));
      }
      let arr = [];
      for (let i = 0; i < 2; i++) {
        arr[i] = parseInt(str.substr(0, str.indexOf("/")));
        str = str.substr(str.indexOf('/') + 1);
      }
      arr[2] = parseInt(str);
      return new Date(arr[2], arr[0] - 1, arr[1]);
    }
    return new Date();
  }

  function checkValidItem(itemId) {
    if (($('#' + itemId + '-img').attr('src') !== '/img/No_Image.jpg') && $('#' + itemId + '-state').val() && $('#' + itemId + '-county').val() && $('#' + itemId + '-agencyName').val() && $('#' + itemId + '-agencyPerson').val() && ($('#' + itemId + '-name').val() || $('#' + itemId + '-sex').val() || $('#' + itemId + '-race').val() || $('#' + itemId + '-dob').val() || $('#' + itemId + '-stateOfBirth').val() || $('#' + itemId + '-cityOfBirth').val() || $('#' + itemId + '-bookedDate').val() || $('#' + itemId + '-releasedDate').val() || $('#' + itemId + '-chargeDescription').val() || $('#' + itemId + '-approvedDate').val())) {
      return true;
    }
    checkError($('#' + itemId + '-state'));
    checkError($('#' + itemId + '-county'));
    checkError($('#' + itemId + '-agencyName'));
    checkError($('#' + itemId + '-agencyPerson'));
    return false;
  }

  function checkError(selector) {
    if (!selector.val()) {
      selector.parent().addClass("has-error");
    } else {
      selector.parent().removeClass("has-error");
    }
  }
  this.btnColor = function() {
    if ((this.type === 'deleteAllUpload') || (this.type === 'deleteAllApprove')) {
      return "btn-danger";
    }
    return "btn-primary";
  };

  // hide modal
  function hideModal() {
    let loaded = true;
    $('.item-img').each(function() {
      if ($(this).attr('src') == "/img/loading.gif") {
        loaded = false;
      }
    });
    if (loaded) {
      $('progress-modal').each(function() {
        $('#progress-pane-uploading').hide();
        $('#progress-pane-success').show();
        $('#progress-pane-success').addClass('fadeIn').delay(500).queue(function() {
          $(this).removeClass("fadeIn").dequeue();
          $(this).addClass("bounceOutUp").delay(500).queue(function() {
            $('progress-modal').remove().dequeue();
          }).dequeue();
        });
      });
    }
  }
}
