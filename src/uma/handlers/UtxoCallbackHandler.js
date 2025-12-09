/**
 * UTXO Callback Handler
 *
 * Handles POST /api/uma/utxocallback
 * Receives UTXO information after payment for KYT compliance.
 */

import * as uma from '@uma-sdk/core';
import { BaseHandler } from './BaseHandler.js';

export class UtxoCallbackHandler extends BaseHandler {
  /**
   * @param {import('../UmaConfig.js').UmaConfig} config
   */
  constructor(config) {
    super(config);
  }

  /**
   * Handle the UTXO callback
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   */
  async handle(request, reply) {
    try {
      // Parse the callback request
      let callback;
      try {
        callback = uma.PostTransactionCallback.parse(request.body);
      } catch (parseError) {
        this.logError(request, parseError, 'Failed to parse UTXO callback');
        return this.sendError(reply, 400, 'Invalid callback format');
      }

      // Verify the signature
      const signatureValid = await this.verifyCallbackSignature(request, callback);
      if (!signatureValid) {
        return this.sendError(reply, 400, 'Invalid callback signature');
      }

      // Process the UTXOs
      const utxos = callback.utxos.map(u => ({
        utxo: u.utxo,
        amountMsats: u.amountMsats,
      }));

      // Call the handler
      await this.config.onUtxosReceived(utxos, callback.vaspDomain);

      // Record for compliance
      await this.config.recordUtxos({
        utxos,
        vaspDomain: callback.vaspDomain,
        signatureNonce: callback.signatureNonce,
        signatureTimestamp: callback.signatureTimestamp,
        receivedAt: Date.now(),
      });

      return reply.status(200).send({ status: 'OK' });
    } catch (error) {
      this.logError(request, error, 'UTXO callback failed');
      return this.sendError(reply, 500, 'Internal server error');
    }
  }

  /**
   * Verify callback signature
   * @param {Object} request - Fastify request object
   * @param {Object} callback - Parsed callback
   * @returns {Promise<boolean>}
   */
  async verifyCallbackSignature(request, callback) {
    try {
      const senderPubKeys = await uma.fetchPublicKeyForVasp({
        cache: this.config.pubKeyCache,
        vaspDomain: callback.vaspDomain,
      });

      const isSignatureValid = await uma.verifyPostTransactionCallbackSignature(
        callback,
        senderPubKeys,
        this.config.nonceCache
      );

      return isSignatureValid;
    } catch (error) {
      this.logError(request, error, 'Callback signature verification failed');
      return false;
    }
  }
}
