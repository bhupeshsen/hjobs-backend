var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

const docSchema = new Schema({
    type: { type: String, trim: true },
    files: { type: Array, default: [] },
    number: { type: String, trim: true }
}, { _id: false });

const eduSchema = new Schema({
    type: { type: String, trim: true },
    board: { type: String, trim: true },
    medium: { type: String, trim: true },
    passingYear: Number,
    percentage: Number,
    specialization: { type: String, trim: true },
    universityName: { type: String, trim: true },
    degree: { type: String, trim: true },
    courseType: { type: String, trim: true }
}, { _id: false });

const jobRoleSchema = new Schema({
    name: { type: String },
    experience: { type: String },
}, { _id: false });

var schema = new Schema({
    addedByCode: { type: String, uppercase: true },
    referredBy: { type: String, trim: true },
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
        type: Number,
        required: true
    },
    photo: {
        type: String,
        trim: true
    },
    dob: { type: Date },
    gender: { type: String },
    address: {
        state: String,
        district: String,
        locality: { type: String, trim: true },
        pinCode: Number
    },
    knownLanguages: Array,
    seeker: {
        iAm: String,
        savedCompany: { type: Array, default: [] },
        savedJobs: { type: Array, default: [] },
        englishSkills: { type: String },
        desiredSalary: String,
        prefWorkLocation: String,
        desiredJobType: String,
        desiredEmpType: String,
        preJobDetails: {
            companyName: String,
            recentDesignation: String,
            recentSalary: String,
            experience: String,
            recentDepartment: String,
            recentIndustry: String,
        },
        jobRoles: [jobRoleSchema],
    },
    documents: [docSchema],
    educations: [eduSchema],
    plan: {
        currentPlan: { type: Schema.ObjectId, default: null, ref: 'Plan' },
        expiryDate: { type: Date, default: new Date('1950-01-01T00:00:00.000Z') },
    },
    referralCode: { type: String, trim: true },
    wallet: { type: Number, default: 0 },
    fcmToken: { type: String },
    password: { type: String },
    passwordResetToken: String,
    passwordResetExpires: Date,
    provider: { type: String, default: 'email' },
    disabled: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    verified: {
        email: { type: Boolean, default: false },
        mobile: { type: Boolean, default: false }
    },
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
}, { collation: { locale: 'en', strength: 2 } });

schema.statics.hashPassword = function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

schema.methods.isValid = function (hashedPassword) {
    return bcrypt.compareSync(hashedPassword, this.password);
}

module.exports = mongoose.model('User', schema);