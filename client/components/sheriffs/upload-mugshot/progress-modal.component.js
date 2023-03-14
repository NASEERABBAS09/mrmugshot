angular.module('lawdawgs').directive('progressModal', function() {
  // Runs during compile
  return {
    restrict: 'EA',
    scope: {},
    bindToController: {
      progressValue: '='
    },
    templateUrl: 'client/components/sheriffs/upload-mugshot/progress-modal.html',
    controllerAs: 'progressModalCtrl',
    controller: ProgressModalController
  };
});


ProgressModalController.$inject = ["$scope", "$reactive"];

function ProgressModalController($scope, $reactive) {
  $reactive(this).attach($scope);

  $('progress-modal').each(function () {
    $(this).animate();
  });

  // $('progress-modal').each(function () {
  //   $(this).prop('Counter',0).animate({
  //       Counter: $(this).text()
  //   }, {
  //       easing: 'swing',
  //       step: function (now) {
  //           $(this).text(Math.ceil(now));
  //       },
  //       complete: function(){
  //         $('#progress-pane-uploading').hide();
  //         $('#progress-pane-success').show();
  //         $('#progress-pane-success').addClass('fadeIn').delay(500).queue(function(){
  //             $(this).removeClass("fadeIn").dequeue();
  //             $(this).addClass("bounceOutUp").delay(250).queue(function(){
  //                 $('#progress-overlay').hide().dequeue();
  //                 $('progress-modal').remove().dequeue();
  //             });
  //         });
  //       }
  //   });
  // });

}