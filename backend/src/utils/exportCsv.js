require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Token = require('../models/Token');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const TokenSequence = require('../models/TokenSequence');
const ActivityLog = require('../models/ActivityLog');
const { jsonToCsv } = require('./csvExporter');

async function exportAllDatasetsToCsv() {
  try {
    await connectDB();
    console.log('[CSV Collector] Connected to MongoDB. Collecting data from all datasets...');

    const exportDir = path.resolve(__dirname, '../../../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // 1. Export Users Dataset
    const users = await User.find().select('-passwordHash').sort({ createdAt: 1 });
    const userHeaders = [
      { key: '_id', label: 'User ID' },
      { key: 'name', label: 'Full Name' },
      { key: 'email', label: 'Email Address' },
      { key: 'role', label: 'Role' },
      { key: 'createdAt', label: 'Created At', get: u => u.createdAt ? new Date(u.createdAt).toISOString() : '' }
    ];
    fs.writeFileSync(path.join(exportDir, 'users_dataset.csv'), jsonToCsv(userHeaders, users));
    console.log(`[CSV Collector] Exported ${users.length} users to exports/users_dataset.csv`);

    // 2. Export Tokens (Tickets) Dataset
    const tokens = await Token.find().populate('serviceId', 'name').populate('counterId', 'name').sort({ createdAt: 1 });
    const tokenHeaders = [
      { key: '_id', label: 'Token ID' },
      { key: 'tokenNumber', label: 'Token Number' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'service', label: 'Service Category', get: t => t.serviceId?.name || 'N/A' },
      { key: 'counter', label: 'Serving Counter', get: t => t.counterId?.name || 'Unassigned' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created At', get: t => t.createdAt ? new Date(t.createdAt).toISOString() : '' },
      { key: 'calledAt', label: 'Called At', get: t => t.calledAt ? new Date(t.calledAt).toISOString() : '' },
      { key: 'completedAt', label: 'Completed At', get: t => t.completedAt ? new Date(t.completedAt).toISOString() : '' }
    ];
    fs.writeFileSync(path.join(exportDir, 'tokens_dataset.csv'), jsonToCsv(tokenHeaders, tokens));
    console.log(`[CSV Collector] Exported ${tokens.length} tickets to exports/tokens_dataset.csv`);

    // 3. Export Services Dataset
    const services = await Service.find().sort({ createdAt: 1 });
    const serviceHeaders = [
      { key: '_id', label: 'Service ID' },
      { key: 'name', label: 'Service Name' },
      { key: 'description', label: 'Description' },
      { key: 'averageServiceTime', label: 'Avg Time (Minutes)' },
      { key: 'isActive', label: 'Is Active' },
      { key: 'createdAt', label: 'Created At', get: s => s.createdAt ? new Date(s.createdAt).toISOString() : '' }
    ];
    fs.writeFileSync(path.join(exportDir, 'services_dataset.csv'), jsonToCsv(serviceHeaders, services));
    console.log(`[CSV Collector] Exported ${services.length} services to exports/services_dataset.csv`);

    // 4. Export Counters Dataset
    const counters = await Counter.find().populate('serviceId', 'name').sort({ createdAt: 1 });
    const counterHeaders = [
      { key: '_id', label: 'Counter ID' },
      { key: 'name', label: 'Counter Name' },
      { key: 'assignedService', label: 'Assigned Department', get: c => c.serviceId?.name || 'N/A' },
      { key: 'isActive', label: 'Is Active' },
      { key: 'createdAt', label: 'Created At', get: c => c.createdAt ? new Date(c.createdAt).toISOString() : '' }
    ];
    fs.writeFileSync(path.join(exportDir, 'counters_dataset.csv'), jsonToCsv(counterHeaders, counters));
    console.log(`[CSV Collector] Exported ${counters.length} counters to exports/counters_dataset.csv`);

    // 5. Export Token Sequences Dataset
    const sequences = await TokenSequence.find().populate('serviceId', 'name').sort({ createdAt: 1 });
    const sequenceHeaders = [
      { key: '_id', label: 'Sequence ID' },
      { key: 'service', label: 'Department', get: s => s.serviceId?.name || 'N/A' },
      { key: 'dateCode', label: 'Operating Date' },
      { key: 'sequence', label: 'Last Issued Counter' }
    ];
    fs.writeFileSync(path.join(exportDir, 'tokensequences_dataset.csv'), jsonToCsv(sequenceHeaders, sequences));
    console.log(`[CSV Collector] Exported ${sequences.length} token sequences to exports/tokensequences_dataset.csv`);

    // 6. Export Activity Logs Dataset
    const logs = await ActivityLog.find().sort({ createdAt: -1 });
    const logHeaders = [
      { key: '_id', label: 'Log ID' },
      { key: 'action', label: 'Action Performed' },
      { key: 'dataset', label: 'Target Dataset' },
      { key: 'performedBy', label: 'Performed By' },
      { key: 'details', label: 'Action Details', get: l => JSON.stringify(l.details || {}) },
      { key: 'createdAt', label: 'Logged At', get: l => l.createdAt ? new Date(l.createdAt).toISOString() : '' }
    ];
    fs.writeFileSync(path.join(exportDir, 'activity_logs_dataset.csv'), jsonToCsv(logHeaders, logs));
    console.log(`[CSV Collector] Exported ${logs.length} audit logs to exports/activity_logs_dataset.csv`);

    console.log('\n=============================================');
    console.log(`✅ All CSV datasets collected successfully in:`);
    console.log(`📁 ${exportDir}`);
    console.log('=============================================');
    process.exit(0);
  } catch (err) {
    console.error('[CSV Collector Error]:', err);
    process.exit(1);
  }
}

exportAllDatasetsToCsv();
