const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenNumber: {
    type: String,
    required: [true, 'Token number is required'],
    trim: true,
    index: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: [2, 'Customer name must be at least 2 characters']
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID reference is required'],
    index: true
  },
  counterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counter',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['WAITING', 'SERVING', 'COMPLETED', 'SKIPPED'],
      message: '{VALUE} is not a valid token status'
    },
    default: 'WAITING',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  calledAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  dateCode: {
    type: String,
    default: () => new Date().toISOString().slice(0, 10),
    index: true
  }
}, {
  collection: 'tokens',
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

// Indexes for high performance queue operations & duplicate prevention
tokenSchema.index({ serviceId: 1, dateCode: 1, tokenNumber: 1 }, { unique: true });
tokenSchema.index({ serviceId: 1, status: 1, createdAt: 1 });
tokenSchema.index({ counterId: 1, status: 1 });
tokenSchema.index({ createdAt: -1 });

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token;
