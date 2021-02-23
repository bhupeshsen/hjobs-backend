var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

var schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    mobile: {
        type: Number
    },
    referralCode: { type: String, trim: true },
    fcmToken: { type: String },
    password: { type: String },
    passwordResetToken: String,
    passwordResetExpires: Date,
    fcmID: String,
    provider: { type: String, default: 'email' },
    deleted: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    createdAt: {
        type: Date,
        default: Date.now(),
        required: true
    },
    updatedAt: {
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

module.exports = mongoose.model('User', schema);