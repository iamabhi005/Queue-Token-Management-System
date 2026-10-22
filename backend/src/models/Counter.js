const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Counter name is required'],
    trim: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID reference is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  collection: 'counters',
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

counterSchema.index({ name: 1 }, { unique: true });
counterSchema.index({ serviceId: 1, isActive: 1 });

const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;
