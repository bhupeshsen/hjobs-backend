var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  name: { type: String, trim: true },
  userId: { type: Schema.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Company1', schema);