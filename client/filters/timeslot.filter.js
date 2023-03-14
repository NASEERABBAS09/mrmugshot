angular
  .module('lawdawgs')
  .filter('timeslotFilter', timeslotFilter);

function timeslotFilter (string) {
  return function (time) {
    if (! time) return;

    return moment(time).format("MMMM D YYYY");
  }
}