const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['LOGIN', 'REGISTER', 'TOKEN_CREATED', 'TOKEN_CALLED', 'TOKEN_COMPLETED', 'TOKEN_SKIPPED', 'SERVICE_CREATED', 'COUNTER_CREATED']
  },
  dataset: {
    type: String,
    required: true,
    enum: ['users', 'tokens', 'services', 'counters']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  performedBy: {
    type: String,
    default: 'SYSTEM'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'activity_logs',
  timestamps: true,
  versionKey: false
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
module.exports = ActivityLog;
