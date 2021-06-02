const { User } = require("../models/user");
const { Notification } = require('../models/notification');
const { pushNotificationUser } = require("./fcm-functions")
const { sendMail } = require('./mail');
const { } = require('./mail-script');

const providerOrder = function (fcmToken, status) {
  const data = {
    title: `Order ${status}ed.`,
    body: `Your order has been ${status}ed.`
  }

  pushNotificationUser(fcmToken, data);
}

const notifyConversation = function (fcmToken, name) {
  const data = {
    title: 'New Message',
    body: `You have received a new message from ${name}`
  }

  pushNotificationUser(fcmToken, data);
}

const notifyShortList = async function (seekerId, recruiterToken, jobTitle) {
  const seeker = await User.findById({ _id: seekerId }, 'name fcmToken').exec();
  const dataS = {
    title: 'Job Status',
    body: `Hi ${seeker.name}, Your status for application ${jobTitle} has been updated.`
  }

  const dataR = {
    title: 'Success',
    body: `You have shortlisted 1 applicant.`
  }

  pushNotificationUser(seeker.fcmToken, dataS);
  pushNotificationUser(recruiterToken, dataR);
  // send mail
  const htmlMessage = '';
  const subject = '';
  sendMail(seeker.email, seeker.name, subject, '', htmlMessage);
}

function saveNotification(isMultiply, userId, userType, notifications) {
  const notification = new Notification({
    userId: ObjectId(userId),
    userType: userType,
    notifications: notifications
  })

  notification.save();
}

module.exports = {
  providerOrder, notifyConversation, notifyShortList
}