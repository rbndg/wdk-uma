/**
 * Post-Transaction Callback Endpoint
 *
 * POST /api/uma/utxocallback - Handle UTXO callback after payment
 */

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 * @param {Function} options.handleUtxoCallback - Handler for UTXO callback
 */
export default async function callbackRoutes(fastify, options) {
  const { handleUtxoCallback } = options;

  // POST /api/uma/utxocallback
  fastify.post('/api/uma/utxocallback', handleUtxoCallback);
}
