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

module.exports = {
  getDatasetsOverview
};
