Payments = new Mongo.Collection("payments");
Plans = new Mongo.Collection("plans");
Invoices = new Mongo.Collection("invoices");

updateStripePlan = function(priceUSD) {
  let planId = Meteor.settings.subscribePlan;
  // Delete old plan
  Stripe.plans.del(planId, Meteor.bindEnvironment((err, confirmation) => {
    if (!err) {
      let basicPlan = {
        id: planId,
        name: 'Basic plan in a year',
        amount: priceUSD * 100,
        currency: 'USD',
        interval: 'year'
      }
      Stripe.plans.create(basicPlan, Meteor.bindEnvironment((err, plan) => {
        if (err) {
          console.log(err);
        } else {
          Plans.update({
            id: planId
          }, {
            $set: plan
          })
          Meteor.users.find({subscriptionId: {$exists: true}}).forEach(function (user) {
            Stripe.subscriptions.update(user.subscriptionId, {
              plan: planId,
              prorate: false
            }, function(err, subscription) {
              if (err) {
                console.log("error: " + user._id);
              }
            });
          });
        }
      }));
    }
  }));
}