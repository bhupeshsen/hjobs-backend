var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

var schema = new Schema({
  baCode: {
    type: String,
    index: {
      unique: true,
      partialFilterExpression: { baCode: { $type: "string" } },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    required: true
  },
  updateAt: {
    type: Date,
    default: Date.now(),
    required: true
  }
});

schema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

schema.methods.isValid = function (hashedPassword) {
  return bcrypt.compareSync(hashedPassword, this.password);
}

const Advisor = mongoose.model('Advisor', schema);
module.exports = { Advisor }