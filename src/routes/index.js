/**
 * UMA Routes Index
 *
 * Registers all UMA protocol routes with the Fastify instance.
 */

import wellKnownRoutes from './wellknown.js';
import payReqRoutes from './payreq.js';
import callbackRoutes from './callback.js';

/**
 * Register all UMA routes
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} handlers - Route handlers
 * @param {Function} handlers.handlePubKeyRequest - GET /.well-known/lnurlpubkey
 * @param {Function} handlers.handleLnurlpRequest - GET /.well-known/lnurlp/:username
 * @param {Function} handlers.handlePayRequest - POST /api/uma/payreq/:callbackId
 * @param {Function} handlers.handleUtxoCallback - POST /api/uma/utxocallback
 */
export async function registerUmaRoutes(fastify, handlers) {
  await fastify.register(wellKnownRoutes, {
    handlePubKeyRequest: handlers.handlePubKeyRequest,
    handleLnurlpRequest: handlers.handleLnurlpRequest,
  });

  await fastify.register(payReqRoutes, {
    handlePayRequest: handlers.handlePayRequest,
  });

  await fastify.register(callbackRoutes, {
    handleUtxoCallback: handlers.handleUtxoCallback,
  });
}

export { wellKnownRoutes, payReqRoutes, callbackRoutes };
