Meteor.startup(function() {
  Stripe = Meteor.npmRequire("stripe")(Meteor.settings.StripeSecretKey);

  Accounts.urls.resetPassword = function(token) {
    return Meteor.absoluteUrl('reset-password/' + token);
  };

  Accounts.emailTemplates.siteName = "Mr. Mugshot";
  Accounts.emailTemplates.from = "Mr. Mugshot<noreply@mrmugshot.com>";
  Accounts.emailTemplates.resetPassword.subject = function(user) {
    return "Mr. Mugshot Portal Password Reset Request";
  };
  Accounts.emailTemplates.resetPassword.html = function(user, url) {
    return "<p>Hello " + user.profile.name + ",</p><p>To reset your password, simply click the link below.</p><p>" + url + "</p><p>Thanks,</p><p><img src='http://i.imgur.com/k6XqXkY.png/'><br/><b>281-997-1147<br/>admin@mrmugshot.com</b></p>";
  };

  if (Plans.find().count() === 0) {
    let basicPlan = {
      id: Meteor.settings.subscribePlan,
      name: 'Basic plan in a year',
      amount: 3600,
      currency: 'USD',
      interval: 'year'
    }
    Stripe.plans.retrieve(Meteor.settings.subscribePlan, Meteor.bindEnvironment((err, plan) => {
      // asynchronously called
      if (err) {
        Stripe.plans.create(basicPlan, Meteor.bindEnvironment((err, plan) => {
          if (err) {
            console.log(err);
          } else {
            Plans.insert(plan);
          }
        }));
      } else {
        Plans.insert(plan);
      }
    }));
  }

  // Init users
  if (Meteor.users.find().count() === 0) {
    let users = [
      { name: "Admin", email: "admin@mrmugshot.com", password: '12345678', agency: 'FRT', roles: ['admin'] },
      { name: "Admin", email: "admin.lawdawgs@yopmail.com", password: '12345678', agency: 'FRT', roles: ['admin'] },
      { name: "Admin", email: "tinmoi1s@gmail.com", password: '12345678', agency: 'FRT', roles: ['admin'] }, {
        name: "Sheriff",
        email: "sheriff@yopmail.com",
        state: "AK",
        county: "AK-02-016",
        stateName: "ALASKA",
        countyName: "Aleutians West Census Area",
        password: '12345678',
        agency: 'FRT',
        roles: ['sheriff']
      },
    ];

    _.each(users, function(user) {
      var id;

      id = Accounts.createUser({
        email: user.email,
        password: user.password,
        profile: {
          name: user.name,
          agency: user.agency,
          state: user.state,
          stateName: user.stateName,
          county: user.county,
          countyName: user.countyName
        }
      });

      if (user.roles.length > 0) {
        Roles.addUsersToRoles(id, user.roles);
      }
    });

  }

  if (Settings.find().count() === 0) {
    Settings.insert({
      code: 'mugshot_price',
      unit: '$',
      perYear: 36,
      perMugshot: 0.99,
      createdAt: moment.utc().toDate(),
      updatedAt: moment.utc().toDate()
    });
  }

  // if (Mugshots.find({}).count() < 10000) {
  //   let file = Attachments.find({})[0];
  //   for(let i = 0; i < 10000; i++) {
  //     Mugshots.insert({
  //       state: "state",
  //       stateName: "sats",
  //       county: "county,",
  //       countyName: "countyName",
  //       name: "name " + i,
  //       sex: "dsg",
  //       race: "abc",
  //       dob: new Date(i, 12, 11),
  //       stateOfBirth: "xyz",
  //       cityOfBirth: "cyity",
  //       bookedDate: new Date(),
  //       releasedDate: new Date(),
  //       chargeDescription: new Date(),
  //       fileName: "name file",
  //       file: file,
  //       status: 'approved',
  //       owner: "vN5nEgTCqgdQt2dGf",
  //       agencyName: "agency",
  //       agencyPerson: "name",
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //       singlePurchase: 0
  //     });
  //   }
  // }

  if (StateCounty.find().count() == 0) {
    // init county
    let mugshotArr = Mugshots.find({status: "approved"});
    mugshotArr.forEach(function(item) {
      if (!item.state || !item.county) {
        return;
      }
      updateAtrr = {
        state: item.state,
        stateName: item.stateName
      };
      updateAtrr["counties." + item.county] = item.countyName;
      StateCounty.update({
        state: item.state
      }, {
        $set: updateAtrr
      }, {
        upsert: true
      });
    });
  }

  // Init mail server.
  process.env.MAIL_URL = "smtp://admin%40mrmugshot.com:xnrtrltjfugkxkhw@smtp.gmail.com:587/";
  process.env.LAWDAWGS_HOST_URL = "http://188.166.229.26:4006";
  process.env.ROOT_URL = "http://188.166.229.26:4006"
});
