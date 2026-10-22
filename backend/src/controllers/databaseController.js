const mongoose = require('mongoose');
const User = require('../models/User');
const Token = require('../models/Token');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const TokenSequence = require('../models/TokenSequence');
const ActivityLog = require('../models/ActivityLog');

/**
 * GET /api/database/datasets
 * Returns detailed overview and statistics of all separate datasets (collections)
 * stored in MongoDB.
 */
const getDatasetsOverview = async (req, res, next) => {
  try {
    const [
      usersCount,
      tokensCount,
      servicesCount,
      countersCount,
      sequencesCount,
      logsCount
    ] = await Promise.all([
      User.countDocuments(),
      Token.countDocuments(),
      Service.countDocuments(),
      Counter.countDocuments(),
      TokenSequence.countDocuments(),
      ActivityLog.countDocuments()
    ]);

    // Sample recent records from each dataset
    const [recentUsers, recentTokens, allServices, allCounters, recentLogs] = await Promise.all([
      User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(5),
      Token.find().populate('serviceId', 'name').populate('counterId', 'name').sort({ createdAt: -1 }).limit(5),
      Service.find().sort({ createdAt: -1 }),
      Counter.find().populate('serviceId', 'name').sort({ createdAt: -1 }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(5)
    ]);

    res.status(200).json({
      success: true,
      database: mongoose.connection.name,
      description: 'DBMS Queue & Token Management Multi-Dataset Architecture',
      totalDatasets: 6,
      datasets: {
        users: {
          datasetName: 'users',
          description: 'Login accounts, credentials, and role-based permissions (ADMIN, STAFF, CUSTOMER)',
          totalRecords: usersCount,
          recentRecords: recentUsers
        },
        tokens: {
          datasetName: 'tokens',
          description: 'Queue tickets, customer passes, current status (WAITING, SERVING, COMPLETED, SKIPPED), counter assignments',
          totalRecords: tokensCount,
          recentRecords: recentTokens
        },
        services: {
          datasetName: 'services',
          description: 'Department service categories, average service processing times, and active flags',
          totalRecords: servicesCount,
          records: allServices
        },
        counters: {
          datasetName: 'counters',
          description: 'Physical service counters/desks linked to specific department services',
          totalRecords: countersCount,
          records: allCounters
        },
        tokensequences: {
          datasetName: 'tokensequences',
          description: 'Concurrency-safe daily sequence counters for atomic ticket number generation',
          totalRecords: sequencesCount
        },
        activity_logs: {
          datasetName: 'activity_logs',
          description: 'Audit history logging user logins, registrations, and ticket lifecycle events',
          totalRecords: logsCount,
          recentRecords: recentLogs
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const { jsonToCsv } = require('../utils/csvExporter');

/**
 * GET /api/database/export/:dataset/csv
 * Direct CSV download endpoint for any dataset
 */
const downloadDatasetCsv = async (req, res, next) => {
  try {
    const { dataset } = req.params;
    let csvContent = '';
    let filename = `${dataset}_dataset.csv`;

    switch (dataset.toLowerCase()) {
      case 'users': {
        const users = await User.find().select('-passwordHash').sort({ createdAt: 1 });
        const headers = [
          { key: '_id', label: 'User ID' },
          { key: 'name', label: 'Full Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'createdAt', label: 'Created At', get: u => u.createdAt ? new Date(u.createdAt).toISOString() : '' }
        ];
        csvContent = jsonToCsv(headers, users);
        break;
      }
      case 'tokens':
      case 'tickets': {
        const tokens = await Token.find().populate('serviceId', 'name').populate('counterId', 'name').sort({ createdAt: 1 });
        const headers = [
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
        filename = 'tokens_dataset.csv';
        csvContent = jsonToCsv(headers, tokens);
        break;
      }
      case 'services': {
        const services = await Service.find().sort({ createdAt: 1 });
        const headers = [
          { key: '_id', label: 'Service ID' },
          { key: 'name', label: 'Service Name' },
          { key: 'description', label: 'Description' },
          { key: 'averageServiceTime', label: 'Avg Time (Mins)' },
          { key: 'isActive', label: 'Is Active' },
          { key: 'createdAt', label: 'Created At', get: s => s.createdAt ? new Date(s.createdAt).toISOString() : '' }
        ];
        csvContent = jsonToCsv(headers, services);
        break;
      }
      case 'counters': {
        const counters = await Counter.find().populate('serviceId', 'name').sort({ createdAt: 1 });
        const headers = [
          { key: '_id', label: 'Counter ID' },
          { key: 'name', label: 'Counter Name' },
          { key: 'service', label: 'Assigned Service', get: c => c.serviceId?.name || 'N/A' },
          { key: 'isActive', label: 'Is Active' },
          { key: 'createdAt', label: 'Created At', get: c => c.createdAt ? new Date(c.createdAt).toISOString() : '' }
        ];
        csvContent = jsonToCsv(headers, counters);
        break;
      }
      case 'logs':
      case 'activity_logs': {
        const logs = await ActivityLog.find().sort({ createdAt: -1 });
        const headers = [
          { key: '_id', label: 'Log ID' },
          { key: 'action', label: 'Action' },
          { key: 'dataset', label: 'Dataset' },
          { key: 'performedBy', label: 'Performed By' },
          { key: 'details', label: 'Details', get: l => JSON.stringify(l.details || {}) },
          { key: 'createdAt', label: 'Logged At', get: l => l.createdAt ? new Date(l.createdAt).toISOString() : '' }
        ];
        filename = 'activity_logs_dataset.csv';
        csvContent = jsonToCsv(headers, logs);
        break;
      }
      default:
        return res.status(400).json({
          success: false,
          message: `Unknown dataset "${dataset}". Supported datasets: users, tokens, services, counters, logs`
        });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDatasetsOverview,
  downloadDatasetCsv
};
