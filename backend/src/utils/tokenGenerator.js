const TokenSequence = require('../models/TokenSequence');

/**
 * Derives a short uppercase prefix from a service name
 * e.g., "General Banking" -> "GB", "Cashier" -> "CSH", "OPD Consultation" -> "OC"
 */
function deriveServicePrefix(serviceName) {
  if (!serviceName) return 'T';
  const words = serviceName.trim().split(/\s+/);
  if (words.length > 1) {
    return words.map(w => w[0].toUpperCase()).join('').slice(0, 4);
  }
  return serviceName.trim().slice(0, 3).toUpperCase();
}

/**
 * Concurrency-safe atomic token number generator.
 * Uses MongoDB findOneAndUpdate with $inc to guarantee monotonic increment
 * with zero duplicate numbers even under heavy concurrent requests.
 *
 * @param {Object} service - Service mongoose document or object
 * @returns {Promise<{ tokenNumber: string, sequence: number, dateCode: string }>}
 */
async function generateNextTokenNumber(service) {
  const now = new Date();
  const dateCode = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const prefix = deriveServicePrefix(service.name);

  // Atomic increment in MongoDB
  const sequenceDoc = await TokenSequence.findOneAndUpdate(
    { serviceId: service._id, dateCode },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const sequence = sequenceDoc.sequence;
  const padded = String(sequence).padStart(3, '0');
  const tokenNumber = `${prefix}-${padded}`;

  return {
    tokenNumber,
    sequence,
    dateCode
  };
}

module.exports = {
  generateNextTokenNumber,
  deriveServicePrefix
};
