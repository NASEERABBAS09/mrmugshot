ErrorMessages = {
  'invalid-data': "Invalid data!",
  'email-existed': "The email is existed!",
  'not-exist': "The object doesn't exist!",
  'email-not-exist': "The email doesn't exist",
  'permission-denied': "Permission denied!"
};

throwError = function (error, reason) {
  if (!reason) {
    reason = ErrorMessages[error];
  }
  throw new Meteor.Error(error, reason);
};