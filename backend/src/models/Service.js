const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    minlength: [2, 'Service name must be at least 2 characters']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  averageServiceTime: {
    type: Number,
    required: [true, 'Average service time (in minutes) is required'],
    min: [1, 'Average service time must be at least 1 minute'],
    default: 10
  }
}, {
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

serviceSchema.index({ name: 1 }, { unique: true });

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;
