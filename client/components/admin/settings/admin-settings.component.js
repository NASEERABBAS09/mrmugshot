angular.module('lawdawgs').directive('adminSettings', function() {
  // Runs during compile
  return {
    restrict: 'EA',
    scope: {},
    bindToController: {
      currentUser: '=',
    },
    templateUrl: 'client/components/admin/settings/admin-settings.html',
    controllerAs: 'adminSetsCtrl',
    controller: AdminSettingsController
  };
});


AdminSettingsController.$inject = ["$scope", "$reactive", "$state",'Flash'];

function AdminSettingsController($scope, $reactive, $state, Flash) {
  $reactive(this).attach($scope);

  this.admin = {};

  this.changeAdminPassword = changeAdminPassword;
  this.setPrice = setPrice;
  this.attachFile = attachFile;
  this.getTermsPrivacy = getTermsPrivacy;
  this.downloadFile = downloadFile;

  this.subscribe('settings');

  this.subscribe('terms-privacy');

  this.helpers({
    mugshotPrice: () => {
      return Settings.findOne({code: "mugshot_price"});
    }
  });

  this.autorun(() => {
    if (!Meteor.user()) {
      $state.go("login");
    }
  });

  // set variable

  function changeAdminPassword() {
    if (_.isEmpty(this.admin)) {
      Flash.create("danger", "Invalid password!");
      return;
    }

    if (this.admin.newPassword !== this.admin.confirmNewPassword) {
      Flash.create("danger", "Confirm password isn't matched!");
      return;
    }

    if (this.admin.newPassword.length < 8) {
      Flash.create("danger", "Password must be at least 8 characters");
      return;
    }

    Accounts.changePassword(this.admin.oldPassword, this.admin.newPassword, (err) => {
      if (!err) {
        Flash.create('success', "The password has been updated successfully", '');
        this.admin = {};
      } else {
        Flash.create('danger', err.reason, '');
      }
    });
  }

  function setPrice() {
    Meteor.call('updateMugshotPrice', this.mugshotPrice, (err, result) => {
       if (!err) {
        Flash.create('success', "The price has been updated successfully", '');
      } else {
        Flash.create('danger', err.reason, '');
      }
    });
  }
  function attachFile (fileUpload, typeString){
    let file = fileUpload[0];
    if (file) {
      // upload file
      let fileName = file.name;
      let fsFile = new FS.File(file);
      fsFile.owner = Meteor.userId();
      FileStore.insert(fsFile, (err, fileObj) => {
        if (err) {
          toastr.error(err);
          return;
        }
        console.log("insert xong file: ", fileObj);
        let tempObj = TermsPrivacy.findOne({
          type: typeString
        });
        if (tempObj) {
          console.log("co roi thi xoa");
          if (tempObj.file !== null) { // neu co file roi
            FileStore.remove({
              _id: tempObj.fileOriginal._id
            }); // xoa file cu
          }
          TermsPrivacy.update( // update file moi
            {
              _id: tempObj._id
            }, {
              $set: {
                fileName: fileName,
                file: fileObj,
                updatedAt: new Date()
              }
            });
        } else { // khong co thi insert
          console.log("chua co thi them");
          TermsPrivacy.insert({
            type: typeString,
            fileName: fileName,
            file: fileObj,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });
      toastr.success("Update successfully!");
    }
  }

  function getTermsPrivacy (type) {
    let rs = TermsPrivacy.findOne({
      type: type
    });
    return rs;
  }

  function downloadFile (typeString) {
    let tempObj = TermsPrivacy.findOne({
      type: typeString
    });
    if (tempObj) {
      var anchor = document.createElement("a");
      anchor.download = tempObj.fileName;
      anchor.href = tempObj.file.url();
      anchor.click();
    }
  }
}
