const fs = require('fs');
const path = require('path');
const { jsonToCsv } = require('./csvExporter');

const User = require('../models/User');
const Token = require('../models/Token');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const TokenSequence = require('../models/TokenSequence');
const ActivityLog = require('../models/ActivityLog');

const exportDir = path.resolve(__dirname, '../../../exports');

function ensureExportDir() {
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
}

function escapeCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// ─────────────────────────────────────────────────────────────
// 1. ATOMIC RECORD APPEND / UPDATE IN CSV FILES
// ─────────────────────────────────────────────────────────────

/**
 * Append or update a user in users_dataset.csv
 */
function recordUserInCsv(user) {
  try {
    ensureExportDir();
    const filePath = path.join(exportDir, 'users_dataset.csv');
    const id = String(user._id || user.id);
    const name = user.name || '';
    const email = user.email || '';
    const role = user.role || 'CUSTOMER';
    const createdAt = user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString();

    const line = [escapeCell(id), escapeCell(name), escapeCell(email), escapeCell(role), escapeCell(createdAt)].join(',');

    if (!fs.existsSync(filePath)) {
      const header = '"User ID","Full Name","Email Address","Role","Created At"';
      fs.writeFileSync(filePath, `${header}\n${line}\n`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);

    let found = false;
    const updatedLines = lines.map((l, idx) => {
      if (idx === 0) return l;
      if (l.startsWith(`"${id}"`) || l.includes(`"${email}"`)) {
        found = true;
        return line;
      }
      return l;
    });

    if (found) {
      fs.writeFileSync(filePath, updatedLines.join('\n') + '\n');
    } else {
      lines.push(line);
      fs.writeFileSync(filePath, lines.join('\n') + '\n');
    }
    console.log(`[CSV Database] Stored user ${email} in users_dataset.csv`);
  } catch (err) {
    console.error('[CSV Database Error - User]:', err.message);
  }
}

/**
 * Append or update a token in tokens_dataset.csv
 */
function recordTokenInCsv(token, serviceName = '', counterName = '') {
  try {
    ensureExportDir();
    const filePath = path.join(exportDir, 'tokens_dataset.csv');
    const id = String(token._id || token.id);
    const tokenNumber = token.tokenNumber || '';
    const customerName = token.customerName || '';
    const sName = serviceName || token.serviceName || (typeof token.serviceId === 'object' ? token.serviceId?.name : '') || 'General Service';
    const cName = counterName || (typeof token.counterId === 'object' ? token.counterId?.name : '') || 'Unassigned';
    const status = token.status || 'WAITING';
    const createdAt = token.createdAt ? new Date(token.createdAt).toISOString() : new Date().toISOString();
    const calledAt = token.calledAt ? new Date(token.calledAt).toISOString() : '';
    const completedAt = token.completedAt ? new Date(token.completedAt).toISOString() : '';

    const line = [
      escapeCell(id),
      escapeCell(tokenNumber),
      escapeCell(customerName),
      escapeCell(sName),
      escapeCell(cName),
      escapeCell(status),
      escapeCell(createdAt),
      escapeCell(calledAt),
      escapeCell(completedAt)
    ].join(',');

    if (!fs.existsSync(filePath)) {
      const header = '"Token ID","Token Number","Customer Name","Service Category","Serving Counter","Status","Created At","Called At","Completed At"';
      fs.writeFileSync(filePath, `${header}\n${line}\n`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);

    let found = false;
    const updatedLines = lines.map((l, idx) => {
      if (idx === 0) return l;
      if (l.startsWith(`"${id}"`)) {
        found = true;
        return line;
      }
      return l;
    });

    if (found) {
      fs.writeFileSync(filePath, updatedLines.join('\n') + '\n');
    } else {
      lines.push(line);
      fs.writeFileSync(filePath, lines.join('\n') + '\n');
    }
    console.log(`[CSV Database] Stored token ${tokenNumber} (${status}) in tokens_dataset.csv`);
  } catch (err) {
    console.error('[CSV Database Error - Token]:', err.message);
  }
}

/**
 * Append or update a service in services_dataset.csv
 */
function recordServiceInCsv(service) {
  try {
    ensureExportDir();
    const filePath = path.join(exportDir, 'services_dataset.csv');
    const id = String(service._id || service.id);
    const name = service.name || '';
    const desc = service.description || '';
    const avgTime = String(service.averageServiceTime || 10);
    const isActive = String(service.isActive !== undefined ? service.isActive : true);
    const createdAt = service.createdAt ? new Date(service.createdAt).toISOString() : new Date().toISOString();

    const line = [escapeCell(id), escapeCell(name), escapeCell(desc), escapeCell(avgTime), escapeCell(isActive), escapeCell(createdAt)].join(',');

    if (!fs.existsSync(filePath)) {
      const header = '"Service ID","Service Name","Description","Avg Time (Minutes)","Is Active","Created At"';
      fs.writeFileSync(filePath, `${header}\n${line}\n`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);

    let found = false;
    const updatedLines = lines.map((l, idx) => {
      if (idx === 0) return l;
      if (l.startsWith(`"${id}"`) || l.includes(`"${name}"`)) {
        found = true;
        return line;
      }
      return l;
    });

    if (found) {
      fs.writeFileSync(filePath, updatedLines.join('\n') + '\n');
    } else {
      lines.push(line);
      fs.writeFileSync(filePath, lines.join('\n') + '\n');
    }
    console.log(`[CSV Database] Stored service ${name} in services_dataset.csv`);
  } catch (err) {
    console.error('[CSV Database Error - Service]:', err.message);
  }
}

/**
 * Append or update a counter in counters_dataset.csv
 */
function recordCounterInCsv(counter, serviceName = '') {
  try {
    ensureExportDir();
    const filePath = path.join(exportDir, 'counters_dataset.csv');
    const id = String(counter._id || counter.id);
    const name = counter.name || '';
    const dept = serviceName || (typeof counter.serviceId === 'object' ? counter.serviceId?.name : '') || 'General Department';
    const isActive = String(counter.isActive !== undefined ? counter.isActive : true);
    const createdAt = counter.createdAt ? new Date(counter.createdAt).toISOString() : new Date().toISOString();

    const line = [escapeCell(id), escapeCell(name), escapeCell(dept), escapeCell(isActive), escapeCell(createdAt)].join(',');

    if (!fs.existsSync(filePath)) {
      const header = '"Counter ID","Counter Name","Assigned Department","Is Active","Created At"';
      fs.writeFileSync(filePath, `${header}\n${line}\n`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);

    let found = false;
    const updatedLines = lines.map((l, idx) => {
      if (idx === 0) return l;
      if (l.startsWith(`"${id}"`) || l.includes(`"${name}"`)) {
        found = true;
        return line;
      }
      return l;
    });

    if (found) {
      fs.writeFileSync(filePath, updatedLines.join('\n') + '\n');
    } else {
      lines.push(line);
      fs.writeFileSync(filePath, lines.join('\n') + '\n');
    }
    console.log(`[CSV Database] Stored counter ${name} in counters_dataset.csv`);
  } catch (err) {
    console.error('[CSV Database Error - Counter]:', err.message);
  }
}

/**
 * Append an activity log into activity_logs_dataset.csv
 */
function recordActivityLogInCsv(log) {
  try {
    ensureExportDir();
    const filePath = path.join(exportDir, 'activity_logs_dataset.csv');
    const id = String(log._id || log.id || Date.now());
    const action = log.action || '';
    const dataset = log.dataset || '';
    const performedBy = log.performedBy || 'System';
    const details = JSON.stringify(log.details || {});
    const createdAt = log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString();

    const line = [escapeCell(id), escapeCell(action), escapeCell(dataset), escapeCell(performedBy), escapeCell(details), escapeCell(createdAt)].join(',');

    if (!fs.existsSync(filePath)) {
      const header = '"Log ID","Action Performed","Target Dataset","Performed By","Action Details","Logged At"';
      fs.writeFileSync(filePath, `${header}\n${line}\n`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    lines.push(line);
    fs.writeFileSync(filePath, lines.join('\n') + '\n');
    console.log(`[CSV Database] Stored audit log ${action} in activity_logs_dataset.csv`);
  } catch (err) {
    console.error('[CSV Database Error - ActivityLog]:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. FULL BATCH SYNC FROM MONGODB (IF CONNECTED)
// ─────────────────────────────────────────────────────────────

async function syncUsersCsv() {
  try {
    ensureExportDir();
    const users = await User.find().select('-passwordHash').sort({ createdAt: 1 });
    const userHeaders = [
      { key: '_id', label: 'User ID' },
      { key: 'name', label: 'Full Name' },
      { key: 'email', label: 'Email Address' },
      { key: 'role', label: 'Role' },
      { key: 'createdAt', label: 'Created At', get: u => u.createdAt ? new Date(u.createdAt).toISOString() : '' }
    ];
    fs.writeFileSync(path.join(exportDir, 'users_dataset.csv'), jsonToCsv(userHeaders, users));
    console.log(`[CSV Sync] Synced ${users.length} users to exports/users_dataset.csv`);
  } catch (err) {
    console.warn('[CSV Sync Notice - Users]:', err.message);
  }
}

async function syncTokensCsv() {
  try {
    ensureExportDir();
    const tokens = await Token.find()
      .populate('serviceId', 'name')
      .populate('counterId', 'name')
      .sort({ createdAt: 1 });

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
    console.log(`[CSV Sync] Synced ${tokens.length} tokens to exports/tokens_dataset.csv`);
  } catch (err) {
    console.warn('[CSV Sync Notice - Tokens]:', err.message);
  }
}

async function syncServicesCsv() {
  try {
    ensureExportDir();
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
    console.log(`[CSV Sync] Synced ${services.length} services to exports/services_dataset.csv`);
  } catch (err) {
    console.warn('[CSV Sync Notice - Services]:', err.message);
  }
}

async function syncCountersCsv() {
  try {
    ensureExportDir();
    const counters = await Counter.find().populate('serviceId', 'name').sort({ createdAt: 1 });
    const counterHeaders = [
      { key: '_id', label: 'Counter ID' },
      { key: 'name', label: 'Counter Name' },
      { key: 'assignedService', label: 'Assigned Department', get: c => c.serviceId?.name || 'N/A' },
      { key: 'isActive', label: 'Is Active' },
      { key: 'createdAt', label: 'Created At', get: c => c.createdAt ? new Date(c.createdAt).toISOString() : '' }
    ];
    fs.writeFileSync(path.join(exportDir, 'counters_dataset.csv'), jsonToCsv(counterHeaders, counters));
    console.log(`[CSV Sync] Synced ${counters.length} counters to exports/counters_dataset.csv`);
  } catch (err) {
    console.warn('[CSV Sync Notice - Counters]:', err.message);
  }
}

async function syncSequencesCsv() {
  try {
    ensureExportDir();
    const sequences = await TokenSequence.find().populate('serviceId', 'name').sort({ createdAt: 1 });
    const sequenceHeaders = [
      { key: '_id', label: 'Sequence ID' },
      { key: 'service', label: 'Department', get: s => s.serviceId?.name || 'N/A' },
      { key: 'dateCode', label: 'Operating Date' },
      { key: 'sequence', label: 'Last Issued Counter' }
    ];
    fs.writeFileSync(path.join(exportDir, 'tokensequences_dataset.csv'), jsonToCsv(sequenceHeaders, sequences));
    console.log(`[CSV Sync] Synced ${sequences.length} sequences to exports/tokensequences_dataset.csv`);
  } catch (err) {
    console.warn('[CSV Sync Notice - Sequences]:', err.message);
  }
}

async function syncActivityLogsCsv() {
  try {
    ensureExportDir();
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
    console.log(`[CSV Sync] Synced ${logs.length} logs to exports/activity_logs_dataset.csv`);
  } catch (err) {
    console.warn('[CSV Sync Notice - Logs]:', err.message);
  }
}

async function syncAllCsvs() {
  await Promise.all([
    syncUsersCsv(),
    syncTokensCsv(),
    syncServicesCsv(),
    syncCountersCsv(),
    syncSequencesCsv(),
    syncActivityLogsCsv()
  ]);
}

module.exports = {
  recordUserInCsv,
  recordTokenInCsv,
  recordServiceInCsv,
  recordCounterInCsv,
  recordActivityLogInCsv,
  syncUsersCsv,
  syncTokensCsv,
  syncServicesCsv,
  syncCountersCsv,
  syncSequencesCsv,
  syncActivityLogsCsv,
  syncAllCsvs
};
