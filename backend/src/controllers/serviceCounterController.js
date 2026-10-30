const Service = require('../models/Service');
const Counter = require('../models/Counter');
const AppError = require('../utils/AppError');
const { recordServiceInCsv, recordCounterInCsv, syncServicesCsv, syncCountersCsv } = require('../utils/csvSync');

/**
 * GET /api/services
 * Public endpoint to retrieve all active service categories
 */
const getActiveServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true })
      .select('name description averageServiceTime isActive createdAt')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/services
 * Administrative endpoint to create a new service category
 */
const createService = async (req, res, next) => {
  try {
    const { name, description, averageServiceTime, isActive } = req.body;

    const existing = await Service.findOne({ name: name.trim() });
    if (existing) {
      return next(new AppError(`A service with the name "${name.trim()}" already exists.`, 409));
    }

    const service = await Service.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      averageServiceTime: averageServiceTime ? Number(averageServiceTime) : 10,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    // Synchronize CSV dataset immediately
    recordServiceInCsv(service);
    syncServicesCsv();

    res.status(201).json({
      success: true,
      message: 'Service category created successfully.',
      data: service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/counters
 * Administrative / Staff endpoint to list all service counters
 */
const getCounters = async (req, res, next) => {
  try {
    const counters = await Counter.find()
      .populate('serviceId', 'name averageServiceTime isActive')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: counters.length,
      data: counters
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/counters
 * Administrative endpoint to create a new physical service counter
 */
const createCounter = async (req, res, next) => {
  try {
    const { name, serviceId, isActive } = req.body;

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return next(new AppError('The specified serviceId does not exist.', 404));
    }

    const existing = await Counter.findOne({ name: name.trim() });
    if (existing) {
      return next(new AppError(`A counter with the name "${name.trim()}" already exists.`, 409));
    }

    const counter = await Counter.create({
      name: name.trim(),
      serviceId: service._id,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    // Synchronize CSV dataset immediately
    recordCounterInCsv(counter, service.name);
    syncCountersCsv();

    const populatedCounter = await Counter.findById(counter._id).populate('serviceId', 'name');

    res.status(201).json({
      success: true,
      message: 'Counter station created successfully.',
      data: populatedCounter
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveServices,
  createService,
  getCounters,
  createCounter
};
