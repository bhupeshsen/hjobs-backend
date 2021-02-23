const admin = require('firebase-admin');
const company = require("../models/company");
const Customer = require('../models/Customer');
const JobSeeker = require('../models/JobSeeker');

module.exports.sendNotificationToUser = async function (userId, userType, notification) {
  var doc = {};

  if (userType == 'company') {
    doc = await company.findById(userId, (err, result) => {
      if (err) return;
      if (result != null) return result; else return;
    });
  } else if (userType == 'customer') {
    doc = await Customer.findById(userId, (err, result) => {
      if (err) return;
      if (result != null) return result; else return;
    });
  } else if (userType == 'seeker') {
    doc = await JobSeeker.findById(userId, (err, result) => {
      if (err) return;
      if (result != null) return result; else return;
    });
  }

  var registrationToken = doc['fcmToken'];

  var message = {
    notification: notification,
    token: registrationToken
  };

  if (registrationToken != null) {
    await admin.messaging().send(message)
      .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
  }
}

module.exports.sendNotificationToTopic = function (topic, data) {
  var message = {
    data: data,
    topic: topic
  };

  // Send a message to devices subscribed to the provided topic.
  admin.messaging().send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
}

module.exports.sendNotificationToMultiUser = async function (userIds, userType, notification) {
  var doc = [];
  const query = { _id: { $in: userIds } };
  const project = { fcmToken: 1, _id: 0 };

  if (userType == 'company') {
    doc = await company.find(query, project, (err, result) => {
      if (err) return;
      if (result != null) return result; else return;
    });
  } else if (userType == 'customer') {
    doc = await Customer.find(query, project, (err, result) => {
      if (err) return;
      if (result != null) return result; else return;
    });
  } else if (userType == 'seeker') {
    doc = await JobSeeker.find(query, project, (err, result) => {
      if (err) return;
      if (result != null) return result; else return;
    });
  }

  var registrationTokens = doc.map(function (item) {
    return item['fcmToken']
  });

  var filteredTokens = registrationTokens.filter(function (el) {
    return el != null;
  });

  var message = {
    notification: notification,
    tokens: filteredTokens
  };

  await admin.messaging().sendMulticast(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
}