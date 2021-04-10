var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  to: {
    userId: { type: Schema.Types.ObjectId },
    userType: String
  },
  from: {
    userId: Schema.ObjectId,
    userType: String
  },
  message: {
    _text: {
      type: String,
      trim: true
    },
    _type: {
      type: String,
      trim: true,
      default: 'text'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
});

module.exports = mongoose.model('Conversation', schema);