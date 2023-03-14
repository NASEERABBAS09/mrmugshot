angular.module('lawdawgs').directive('termsPrivacyManagement', function() {
  return {
    restrict: 'EA',
    templateUrl: 'client/components/admin/terms-privacy-management/terms-privacy-management.html',
    controllerAs: 'TermsPriManageCrtl',
    controller: TermsPriManageController
  };
});
TermsPriManageController.$inject = ["$scope", "$reactive", "SweetAlert", "$stateParams"];

function TermsPriManageController($scope, $reactive, SweetAlert, $stateParams) {
  $reactive(this).attach($scope);
  // init
  let vm = this;
  this.saveContent = saveContent;
  this.options = {
    height: 500,
    focus: true,
    toolbar: [
      ['edit', ['undo', 'redo']],
      ['headline', ['style']],
      ['style', ['bold', 'italic', 'underline', 'superscript', 'subscript', 'strikethrough', 'clear']],
      ['fontface', ['fontname']],
      ['textsize', ['fontsize']],
      ['fontclr', ['color']],
      ['alignment', ['ul', 'ol', 'paragraph', 'lineheight']],
      ['height', ['height']],
      ['table', ['table']],
      ['insert', ['link', 'picture', 'video', 'hr']],
      ['view', ['fullscreen', 'codeview']],
      ['help', ['help']]
    ]
  };
  this.type = $stateParams.type;
  this.autorun(() => {
    if (this.getReactively('type') === 'user-terms') {
      vm.stringType = 'User Terms of Service';
    }
    if (this.getReactively('type') === 'user-privacy') {
      vm.stringType = 'User Privacy';
    }
    if (this.getReactively('type') === 'sheriff-terms') {
      vm.stringType = 'Sheriff Terms of Service';
    }
  });

  this.subscribe('terms-privacy');

  this.helpers({
    content: () => {
      let termsPrivacy = TermsPrivacy.findOne({ type: vm.getReactively('type') });
      if (termsPrivacy) {
        return termsPrivacy.content;
      } else {
        return "";
      }
    }
  });

  function saveContent() {
    let termsPrivacy = TermsPrivacy.findOne({ type: vm.getReactively('type') });
    if (termsPrivacy) {
      TermsPrivacy.update({
        _id: termsPrivacy._id
      }, {
        $set: {
          content: vm.content
        }
      });
    } else {
      TermsPrivacy.insert({
        type: vm.type,
        content: vm.content
      });
    }
    toastr.success("Updated!");
  }
}
