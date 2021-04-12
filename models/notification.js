const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  userId: {
    type: Schema.ObjectId,
    required: true
  },
  notifications: {
    title: {
      type: String,
      trim: true
    },
    body: {
      type: String,
      trim: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    required: true
  }
});

module.exports = mongoose.model('Notification', schema);