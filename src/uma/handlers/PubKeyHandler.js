/**
 * Public Key Handler
 *
 * Handles GET /.well-known/lnurlpubkey
 * Returns public keys for signature verification and encryption.
 */

import { BaseHandler } from './BaseHandler.js';

export class PubKeyHandler extends BaseHandler {
  /**
   * @param {import('../UmaConfig.js').UmaConfig} config
   */
  constructor(config) {
    super(config);
  }

  /**
   * Handle the public key request
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   */
  async handle(request, reply) {
    try {
      const response = {};

      // Get signing key (either cert chain or raw pubkey)
      const signingCertChain = await this.config.getSigningCertChain();
      if (signingCertChain) {
        response.signingCertChain = signingCertChain;
      }

      const signingPubKey = await this.config.getSigningPublicKey();
      if (signingPubKey) {
        response.signingPubKey = signingPubKey;
      }

      // Get encryption key (either cert chain or raw pubkey)
      const encryptionCertChain = await this.config.getEncryptionCertChain();
      if (encryptionCertChain) {
        response.encryptionCertChain = encryptionCertChain;
      }

      const encryptionPubKey = await this.config.getEncryptionPublicKey();
      if (encryptionPubKey) {
        response.encryptionPubKey = encryptionPubKey;
      }

      // Optional expiration timestamp
      const expirationTimestamp = await this.config.getExpirationTimestamp();
      if (expirationTimestamp) {
        response.expirationTimestamp = expirationTimestamp;
      }

      return reply.send(response);
    } catch (error) {
      this.logError(request, error, 'Failed to get public keys');
      return this.sendError(reply, 500, 'Failed to retrieve public keys');
    }
  }
}
