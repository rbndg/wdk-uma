/**
 * Pay Request Endpoint
 *
 * POST /api/uma/payreq/:callbackId - Handle pay request from sending VASP
 */

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 * @param {Function} options.handlePayRequest - Handler for pay request
 */
export default async function payReqRoutes(fastify, options) {
  const { handlePayRequest } = options;

  // POST /api/uma/payreq/:callbackId
  fastify.post('/api/uma/payreq/:callbackId', handlePayRequest);
}
