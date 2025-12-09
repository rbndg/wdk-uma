/**
 * Well-Known UMA Endpoints
 *
 * GET /.well-known/lnurlpubkey - Public key discovery
 * GET /.well-known/lnurlp/:username - LNURLP request
 */

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 * @param {Function} options.handlePubKeyRequest - Handler for pubkey endpoint
 * @param {Function} options.handleLnurlpRequest - Handler for lnurlp endpoint
 */
export default async function wellKnownRoutes(fastify, options) {
  const { handlePubKeyRequest, handleLnurlpRequest } = options;

  // GET /.well-known/lnurlpubkey
  fastify.get('/.well-known/lnurlpubkey', handlePubKeyRequest);

  // GET /.well-known/lnurlp/:username
  fastify.get('/.well-known/lnurlp/:username', handleLnurlpRequest);
}
