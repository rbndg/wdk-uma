/**
 * UMA Routes Index
 *
 * Registers all UMA protocol routes with the Fastify instance.
 */

import { executeHandler } from '../uma/handlers/index.js';
import { registerAdminRoutes } from './admin.js';

/**
 * Register all UMA routes
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {import('../domains/TenantManager.js').TenantManager} opts.tenants
 */
export async function registerUmaRoutes(fastify, opts) {

  // GET /.well-known/lnurlpubkey
  fastify.get('/.well-known/lnurlpubkey', async (request, reply) => {
    const umaConfig = request.tenant.getUmaConfig();
    return executeHandler.handlerPubKeyRequest(umaConfig, request, reply);
  });

  // GET /.well-known/lnurlp/:username
  fastify.get('/.well-known/lnurlp/:username', async (request, reply) => {
    const umaConfig = request.tenant.getUmaConfig();
    return executeHandler.handlerLnurlpRequest(umaConfig, request, reply);
  });

  // POST /api/uma/payreq/:callbackId
  fastify.post('/api/uma/payreq/:callbackId', async (request, reply) => {
    const umaConfig = request.tenant.getUmaConfig();
    return executeHandler.handlerPayRequest(umaConfig, request, reply);
  });

  // POST /api/uma/utxocallback
  fastify.post('/api/uma/utxocallback', async (request, reply) => {
    const umaConfig = request.tenant.getUmaConfig();
    return executeHandler.handlerUtxoCallback(umaConfig, request, reply);
  });

  await registerAdminRoutes(fastify, opts)

}
