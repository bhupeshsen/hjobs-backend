var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  to: { type: Schema.Types.ObjectId, ref: 'User' },
  from: { type: Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, trim: true },
  createdAt: {
    type: Date,
    default: Date.now()
  },
});

const Conversation = mongoose.model('Conversation', schema);
module.exports = { Conversation };