angular.module('lawdawgs', ['angular-meteor', 'angular-meteor.auth', 'ngSanitize', 'ui.router', 'ui.bootstrap', 'flash', 'oitozero.ngSweetAlert', 'ngFileUpload', 'infinite-scroll', 'summernote']);
if (Meteor.isCordova) {
  angular.element(document).on('deviceready', onReady);
} else {
  angular.element(document).ready(onReady);
}

function onReady() {
  angular.bootstrap(document, ['lawdawgs'], {
    strictDi: true
  });
}