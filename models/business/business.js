var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

var schema = new Schema({
  cmCode: {
    type: String,
    index: {
      unique: true,
      partialFilterExpression: { cmCode: { $type: "string" } },
    },
  },
  bcCode: {
    type: String,
    index: {
      unique: true,
      partialFilterExpression: { bcCode: { $type: "string" } },
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

const BC = mongoose.model('BC', schema);
const CM = mongoose.model('CM', schema);
module.exports = { BC, CM }