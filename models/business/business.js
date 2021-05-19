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
  name: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true
  },
  email: {
    type: String,
    required: true, trim: true,
    unique: true, index: true
  },
  relationshipName: {
    name: {
      type: String,
      required: true
    },
    relation: {
      type: String,
      required: true,
    }
  },
  knownLanguages: Array,
  qualification: {
    type: String,
    required: true,
  },
  residentialAddress: {
    houseName: {
      type: String,
      trim: true
    },
    streetNo: {
      type: String,
      trim: true
    },
    villageWard: {
      type: String,
      trim: true
    },
    tehseel: {
      type: String,
      trim: true
    },
    locality: {
      type: String,
      trim: true
    },
    state: String,
    district: String,
    city: String,
    pinCode: { type: Number },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: props => `${props.value} is not a valid mobile number!`
      },
    },
  },
  mobile: {
    type: String,
    validate: {
      validator: function (v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid mobile number!`
    }
  },
  whatsAppMobile: {
    type: String,
    validate: {
      validator: function (v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid mobile number!`
    },
  },
  documents: {
    aadharCard: {
      number: { type: Number },
      aadharF: { type: String },
      aadharB: { type: String }
    },
    panCard: {
      number: {
        type: String,
        uppercase: true,
        validate: {
          validator: function (v) {
            return /^[A-Z]{3}[P][A-Z]{1}[0-9]{4}[A-Z]{1}$/.test(v);
          },
          message: props => `${props.value} is not a valid pan number!`
        }
      },
      image: { type: String }
    },
    residentialProof: {
      proofType: String,
      proofImage: String
    },
    bank: {
      passbook: String
    }
  },
  currentStatus: {
    type: String,
    required: true,
    trim: true
  },
  currentBusiness: {
    occupation: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      trim: true
    },
    businessName: {
      type: String,
      trim: true
    },
    address: {
      streetNumber: {
        type: String,
        trim: true
      },
      villageWard: {
        type: String,
        trim: true
      },
      tehseel: {
        type: String,
        trim: true
      },
      state: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      },
      locality: { type: String, trim: true },
      pinCode: {
        type: Number
      },
      phone: { type: Number },
    },
    businessYear: {
      type: Date
    },
    dimension: {
      width: Number,
      height: Number
    },
    infrastructureList: {
      type: Array
    },
    income: {
      type: Number
    },
    customer: {
      existCustomer: {
        type: Number
      },
      numberNeighbouring: {
        type: Number
      },
      estimateCustomer: {
        type: Number
      },
    },
    awardAchievement: {
      type: String
    },
  },
  education: {
    school: {
      passingYear: { type: Number },
      percentage: { type: Number },
      board: { type: String, trim: true },
      specialization: { type: String, trim: true }
    },
    diploma: {
      name: { type: String, trim: true },
      universityName: { type: String, trim: true },
      passingYear: Number,
      percentage: Number,
      courseType: { type: String },
    },
    graduation: {
      degree: { type: String, trim: true },
      universityName: { type: String, trim: true },
      passingYear: { type: Number },
      percentage: { type: Number },
      courseType: { type: String },
      specialization: { type: String }
    },
    postGraduation: {
      degree: { type: String, trim: true },
      universityName: { type: String, trim: true },
      passingYear: { type: Number },
      percentage: { type: Number },
      courseType: { type: String },
      specialization: { type: String }
    }
  },
  references: {
    ref1: {
      name: String,
      mobile: String,
      occupation: String,
      address: String
    },
    ref2: {
      name: String,
      mobile: String,
      occupation: String,
      address: String
    },
  },
  photo: { type: String },
  bank: {
    accountNumber: { type: Number },
    bankHolderName: { type: String },
    bankBranch: { type: String },
    ifscCode: { type: String, uppercase: true },
    name: { type: String }
  },
  fcmToken: { type: String, default: null },
  disabled: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  approvedDate: { type: Date, default: new Date('1950-01-01T00:00:00.000Z') },
  expiryDate: { type: Date, default: new Date('1950-01-01T00:00:00.000Z') },
  level: { type: Number, default: 0 },
  totalLogins: { type: Number, default: 0 },
  userType: { type: String, required: true },
  wallet: { type: Number, default: 0 },
  addedByCode: { type: String },
  code: Number,
  password: { type: String },
  passwordResetToken: String,
  passwordResetExpires: Date,
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