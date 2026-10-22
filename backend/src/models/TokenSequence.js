const mongoose = require('mongoose');

const tokenSequenceSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  dateCode: {
    type: String, // 'YYYY-MM-DD'
    required: true
  },
  sequence: {
    type: Number,
    default: 0
  }
}, {
  collection: 'tokensequences',
  timestamps: true,
  versionKey: false
});

// Compound unique index ensures atomic single counter document per service per operating day
tokenSequenceSchema.index({ serviceId: 1, dateCode: 1 }, { unique: true });

const TokenSequence = mongoose.model('TokenSequence', tokenSequenceSchema);
module.exports = TokenSequence;
