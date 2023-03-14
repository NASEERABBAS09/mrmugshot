Accounts.config({
  forbidClientAccountCreation: true
});
/* Publish*/
Meteor.publish(null, function() {
  return Meteor.roles.find({})
});
Meteor.publish('sheriffs', function(options) {
  let sortQuery = {};
  let type = 'createdAt';
  let reverse = -1;
  if (!_.isEmpty(options)) {
    if (options.sortType) {
      type = options.sortType.toString();
    }
    if (options.sortReverse) {
      reverse = 1;
    }
  }
  sortQuery[type] = reverse;
  return Meteor.users.find({
    roles: {
      $in: ['sheriff']
    }
  }, {
    sort: sortQuery
  });
});
// publish users
Meteor.publish("user_management", function(options) {
  if (!_.isEmpty(options)) {
    let optionsParam = getOptionsParam(options);
    let users = [];
    let findQuery = {};
    if (options.selectedType == 'all') {
      findQuery["roles"] = {
        $nin: ["admin", "sheriff"]
      };
    } else {
      findQuery["_id"] = {
        $in: optionsParam.arrUserId
      };
    }
    if (options.query) {
      let queryObj = {
        $regex: options.query,
        $options: 'msi'
      };
      findQuery['$or'] = [{
        email: queryObj
      }, {
        "services.facebook.id": queryObj
      }];
    }
    users = Meteor.users.find(findQuery, {
      sort: optionsParam.sortQuery,
      skip: (options.currentPage * options.itemsPerPage),
      limit: (options.itemsPerPage)
    });
    return users;
  }
});
// publish count
Meteor.publish("UsersMgtCounter", function(options) {
  if (!_.isEmpty(options)) {
    let optionsParam = getOptionsParam(options);
    let findQuery = {};
    findQuery["_id"] = {
      $in: optionsParam.arrUserId
    };
    if (!_.isEmpty(options)) {
      if (options.query) {
        let queryObj = {
          $regex: options.query,
          $options: 'msi'
        };
        findQuery['$or'] = [{
          email: queryObj
        }, {
          "services.facebook.id": queryObj
        }];
      }
    }
    Counts.publish(this, 'usersMgtCounter', Meteor.users.find(findQuery));
  }
});
Meteor.publish('AllUserCounter', function(options) {
  let findQuery = {};
  findQuery["roles"] = {
    $nin: ["admin", "sheriff"]
  };
  if (!_.isEmpty(options)) {
    if (options.query) {
      let queryObj = {
        $regex: options.query,
        $options: 'msi'
      };
      findQuery['$or'] = [{
        email: queryObj
      }, {
        "services.facebook.id": queryObj
      }];
    }
  }
  Counts.publish(this, 'allUserCounter', Meteor.users.find(findQuery));
});

function getOptionsParam(options) {
  let type = 'lastLogin';
  let reverse = -1;
  let findQueryPayment = {};
  let findQueryUser = {};
  let sortQuery = {};
  if (options.sortType) {
    type = options.sortType.toString();
  }
  if (options.sortReverse) {
    reverse = 1;
  }
  sortQuery[type] = reverse;
  if (options.fromDate || options.toDate) {
    let rangeDate = {};
    if (options.fromDate) {
      rangeDate['$gte'] = moment.utc(options.fromDate, 'M/D/YYYY')._d;
    }
    if (options.toDate) {
      rangeDate['$lte'] = moment.utc(options.toDate, 'M/D/YYYY').endOf('day')._d;
    }
    findQueryPayment['createdAt'] = rangeDate;
  }
  if (options.selectedType) {
    findQueryPayment['type'] = options.selectedType.toString();
  }
  let payments = Payments.find(findQueryPayment);
  let arrUserId = [];
  payments.forEach(function(item, index) {
    arrUserId.push(item.userId);
  });
  return {
    arrUserId,
    sortQuery
  }
}
/* Methods */
Meteor.methods({
  sendResetPassword: function(email) {
    try {
      check(email, String);
    } catch (error) {
      throwError('invalid-data');
    }
    let user = Accounts.findUserByEmail(email);
    if (!user) {
      throwError('email-not-exist');
    }
    if (!Roles.userIsInRole(user, ['admin', 'sheriff'])) {
      throwError('permission-denied');
    }
    return Accounts.sendResetPasswordEmail(user._id, email);
  },
  inviteSheriff: function(obj) {
    console.log(obj);
    let email = obj.email;
    let agency = obj.agency;
    let name = obj.name;
    let state = obj.state;
    let stateName = obj.stateName;
    let county = obj.county;
    let countyName = obj.countyName;
    try {
      check(email, String);
    } catch (error) {
      throwError('invalid-data');
    }
    let currUser = Meteor.user();
    if (!currUser || !Roles.userIsInRole(currUser, ['admin'])) {
      throwError('permission-denied');
    }
    let inviteSheriff = Accounts.findUserByEmail(email);
    if (inviteSheriff) { // da co user
      if (Roles.userIsInRole(inviteSheriff, ['sheriff'])) { // da la sheriff --> return
        throwError('email-existed');
      }
      Roles.addUsersToRoles(inviteSheriff._id, ['sheriff']); // add role
      Meteor.users.update(inviteSheriff._id, { // update info
        $set: {
          "profile.name": name,
          "profile.agency": agency,
          "profile.state": state,
          "profile.stateName": stateName,
          "profile.county": county,
          "profile.countyName": countyName
        }
      });
      if (inviteSheriff.services.password) { //// user da co password
        SSR.compileTemplate('htmlEmailHadPass', Assets.getText('invite-email-had-pass.html'));
        var emailData = {
          url: process.env.LAWDAWGS_HOST_URL,
          name: name
        };
        Email.send({
          to: email,
          from: currUser.emails[0].address,
          subject: "Invite to Mr. Mugshot Portal",
          html: SSR.render('htmlEmailHadPass', emailData)
        });
      } else { //// user chua co password
        let password = Random.id(8);
        Accounts.setPassword(inviteSheriff._id, password);
        SSR.compileTemplate('htmlEmail', Assets.getText('invite-email.html'));
        var emailData = {
          url: process.env.LAWDAWGS_HOST_URL,
          password: password,
          name: name
        };
        Email.send({
          to: email,
          from: currUser.emails[0].address,
          subject: "Invite to Mr. Mugshot Portal",
          html: SSR.render('htmlEmail', emailData)
        });
      }
    } else { // chua co user
      SSR.compileTemplate('htmlEmail', Assets.getText('invite-email.html'));
      let password = Random.id(8);
      let sheriffId;
      sheriffId = Accounts.createUser({
        email: email,
        password: password,
        profile: {
          name: name,
          agency: agency,
          state: state,
          stateName: stateName,
          county: county,
          countyName: countyName
        }
      });
      Roles.addUsersToRoles(sheriffId, ['sheriff']);
      var emailData = {
        url: process.env.LAWDAWGS_HOST_URL,
        password: password,
        name: name
      };
      Email.send({
        to: email,
        from: currUser.emails[0].address,
        subject: "Invite to Mr. Mugshot Portal",
        html: SSR.render('htmlEmail', emailData)
      });
      Meteor.users.update({
        _id: sheriffId
      }, {
        $set: {
          isInvited: true
        }
      });
    }
  },
  deleteSheriff: function(sheriffId) {
    let currUser = Meteor.user();
    if (!currUser || !Roles.userIsInRole(currUser, ['admin']) || currUser._id == sheriffId) {
      throwError('permission-denied');
    }
    let sheriff = Meteor.users.findOne({
      _id: sheriffId,
      roles: ['sheriff']
    });
    if (!sheriff) {
      throwError('not-exist');
    }
    if (sheriff) {
      Meteor.users.remove({
        _id: sheriffId
      });
    }
    return sheriffId
  },
  checkSubmitted: function(sheriffId) {
    let count = Mugshots.find({
      owner: sheriffId,
      status: {
        $ne: "pending"
      }
    }).count();
    let hadSubmitted = false;
    if (count > 0) { // neu co roi
      hadSubmitted = true;
      Meteor.users.update({
        _id: sheriffId
      }, {
        $set: {
          hadSubmitted: hadSubmitted
        }
      });
    }
    return hadSubmitted; // neu chua co
  },
  setTogleActionUser: function(params) {
    let userId = params.userId;
    let action = params.action;
    Meteor.users.update(userId, {
      $set: {
        action: action
      }
    });
  },
  removeUserById: function(userId) {
    return Meteor.users.remove(userId);
  },
  getTotalSingle: function() {
    return Payments.find({
      type: "purchased"
    }).count();
  },
  getTotalSubscription: function() {
    let subscribes = Payments.find({
      type: "subscribed"
    });
    let total = 0;
    let amount = 0;
    subscribes.forEach(function(item, index) {
      amount = parseFloat(item.amount) || 0;
      if (item.paymentMethod == "paypal") {
        amount *= 100;
      }
      total += amount;
    });
    return total / 100;
  },
  getTotalPurchased: function() {
    let purchases = Payments.find({
      type: "purchased"
    });
    let total = 0;
    let amount = 0;
    purchases.forEach(function(item, index) {
      amount = parseFloat(item.amount) || 0;
      if (item.paymentMethod == "paypal") {
        amount *= 100;
      }
      total += amount;
    });
    return total / 100;
  },
  getAgency: function() {
    let agency = {};
    let agencyName = new Set();
    let agencyPerson = new Set();
    let users = Meteor.users.find({
      roles: {
        $in: ["sheriff"]
      }
    }, {
      fields: {
        'profile.agency': 1,
        'profile.name': 1
      }
    });
    users.forEach(function(item, index) {
      if (item.profile) {
        if (item.profile.agency) {
          agencyName.add(item.profile.agency);
        }
        if (item.profile.name) {
          agencyPerson.add(item.profile.name);
        }
      }
    });
    agency.agencyName = Array.from(agencyName);
    agency.agencyPerson = Array.from(agencyPerson);
    return agency;
  },
  checkFirstLogin: function() {
    // check first
    let check = (Meteor.user().firstLogin == undefined);
    console.log(check);
    return check;
  },
  setFirstLogin: function() {
    // update first login
    Meteor.users.update(Meteor.userId(), {
      $set: {
        firstLogin: "true"
      }
    });
  },
  setEmail: function(userId) {
    check(userId, String);
    // check admin
    let adminUser = Meteor.user();
    if (!adminUser || !Roles.userIsInRole(adminUser, ['admin'])) {
      throwError('permission-denied');
    }
    // set email field
    let currUser = Meteor.users.findOne({ _id: userId });
    let currEmail = (currUser.emails && currUser.emails[0].address) || (currUser.services.facebook && (currUser.services.facebook.email || currUser.services.facebook.id)) || (currUser.services.google && currUser.services.google.email);
    Meteor.users.update({
      _id: userId
    }, {
      $set: {
        email: currEmail
      }
    });
    return;
  }
});
