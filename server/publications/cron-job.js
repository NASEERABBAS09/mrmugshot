// field allowed values
// -- -- -- -- -- -- -- -- -- --
// minute 0 - 59
// hour 0 - 23
// day of month 1 - 31
// month 1 - 12(or names, see below)
// day of week 0 - 7(0 or 7 is Sun, or use names)

// Run once a year, ie. "0 0 1 1 *".
// Run once a month, ie. "0 0 1 * *".
// Run once a week, ie. "0 0 * * 0".
// Run once a day, ie. "0 0 * * *".
// Run once an hour, ie. "0 * * * *".

// cron job check expire date card and send mail
var isExpire = function(endDate) {
  if (moment().isSameOrAfter(endDate)) {
    return true;
  } else {
    return false;
  }
}
var sendWarningEmail = function() {
  let userLst = Meteor.users.find({ subscriptionId: { $exists: true } });
  userLst.forEach(function(item, index) {
    if (isExpire(item.subscription.ends) && (item.profile.renewSub == true)) {
      SSR.compileTemplate('htmlEmailSubscription', Assets.getText('warning-subscription-email.html'));
      var emailData = {
        url: process.env.LAWDAWGS_HOST_URL,
        name: item.email
      };
      Email.send({
        to: item.email,
        from: "admin@mrmugshot.com",
        subject: "Mr. Mugshot Subscription Expired",
        html: SSR.render('htmlEmailSubscription', emailData)
      });
      console.log("Send Email: " + item.email);
    }
  });
}
var cron = new Meteor.Cron({
  events: {
    "0 0 1 * *": sendWarningEmail
  }
});
