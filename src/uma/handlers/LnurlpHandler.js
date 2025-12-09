/**
 * LNURLP Request Handler
 *
 * Handles GET /.well-known/lnurlp/:username
 * Processes both standard LNURL and UMA requests.
 */

import * as uma from '@uma-sdk/core';
import { BaseHandler } from './BaseHandler.js';

export class LnurlpHandler extends BaseHandler {
  /**
   * @param {import('../UmaConfig.js').UmaConfig} config
   */
  constructor(config) {
    super(config);
  }

  /**
   * Handle the LNURLP request
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   */
  async handle(request, reply) {
    const { username } = request.params;

    try {
      // Look up the user
      const user = await this.config.getUserByUsername(username);
      if (!user) {
        return this.sendError(reply, 404, 'User not found');
      }

      // Build full URL for parsing
      const fullUrl = this.buildFullUrl(request);

      // Parse the LNURLP request
      let lnurlpRequest;
      try {
        lnurlpRequest = uma.parseLnurlpRequest(fullUrl);
      } catch (parseError) {
        this.logError(request, parseError, 'Failed to parse LNURLP request');
        return this.sendError(reply, 400, 'Invalid LNURLP request format');
      }

      // Check if this is a UMA request
      const isUmaRequest = uma.isUmaLnurlpQuery(lnurlpRequest);

      // Verify signature for UMA requests
      if (isUmaRequest) {
        const signatureValid = await this.verifyUmaSignature(request, lnurlpRequest);
        if (!signatureValid) {
          return this.sendError(reply, 400, 'Invalid signature');
        }
      }

      // Build and send response
      const response = await this.buildResponse(user, username, lnurlpRequest, isUmaRequest);

      if (isUmaRequest) {
        return reply.send(response.toJsonSchemaObject());
      } else {
        return reply.send(response);
      }
    } catch (error) {
      this.logError(request, error, 'LNURLP request failed');
      return this.sendError(reply, 500, 'Internal server error');
    }
  }

  /**
   * Build full URL from request
   * @param {Object} request - Fastify request object
   * @returns {string}
   */
  buildFullUrl(request) {
    const protocol = request.headers['x-forwarded-proto'] || request.protocol || 'https';
    const host = request.headers['x-forwarded-host'] || request.hostname;
    return `${protocol}://${host}${request.url}`;
  }

  /**
   * Verify UMA signature
   * @param {Object} request - Fastify request object
   * @param {Object} lnurlpRequest - Parsed LNURLP request
   * @returns {Promise<boolean>}
   */
  async verifyUmaSignature(request, lnurlpRequest) {
    try {
      // Fetch sender VASP's public keys
      const senderPubKeys = await uma.fetchPublicKeyForVasp({
        cache: this.config.pubKeyCache,
        vaspDomain: lnurlpRequest.vaspDomain,
      });

      // Verify the signature
      const isSignatureValid = await uma.verifyUmaLnurlpQuerySignature(
        lnurlpRequest,
        senderPubKeys,
        this.config.nonceCache
      );

      if (!isSignatureValid) {
        return false;
      }

      // Optionally verify backing signatures
      if (lnurlpRequest.backingSignatures?.length > 0) {
        const backingValid = await uma.verifyUmaLnurlpQueryBackingSignatures(
          lnurlpRequest,
          this.config.pubKeyCache
        );
        if (!backingValid) {
          this.logWarn(request, 'Invalid backing signatures on LNURLP request');
        }
      }

      return true;
    } catch (error) {
      this.logError(request, error, 'Signature verification failed');
      return false;
    }
  }

  /**
   * Build LNURLP response
   * @param {Object} user - User object
   * @param {string} username - Username
   * @param {Object} lnurlpRequest - Parsed LNURLP request
   * @param {boolean} isUmaRequest - Whether this is a UMA request
   * @returns {Promise<Object>}
   */
  async buildResponse(user, username, lnurlpRequest, isUmaRequest) {
    const vaspDomain = await this.config.getVaspDomain();
    const receiverAddress = `$${username}@${vaspDomain}`;
    const callbackUrl = await this.config.getCallbackUrl(username);

    // Create metadata
    const metadata = JSON.stringify([
      ['text/plain', `Pay to ${receiverAddress}`],
      ['text/identifier', receiverAddress],
    ]);

    if (isUmaRequest) {
      // Generate UMA-compliant response
      const signingPrivateKey = await this.config.getSigningPrivateKey();
      const currencies = await this.config.getCurrencies();
      const payerDataOptions = await this.config.getPayerDataOptions();

      return await uma.getLnurlpResponse({
        request: lnurlpRequest,
        callback: callbackUrl,
        requiresTravelRuleInfo: user.requiresTravelRule ?? true,
        encodedMetadata: metadata,
        minSendableSats: this.config.minSendableSats,
        maxSendableSats: this.config.maxSendableSats,
        privateKeyBytes: signingPrivateKey,
        receiverKycStatus: user.kycStatus || uma.KycStatus.Verified,
        payerDataOptions,
        currencyOptions: currencies,
        receiverChannelUtxos: user.channelUtxos || [],
        receiverNodePubKey: user.nodePubKey,
      });
    } else {
      // Standard LNURL response (non-UMA)
      return {
        tag: 'payRequest',
        callback: callbackUrl,
        minSendable: this.config.minSendableSats * 1000, // Convert to millisats
        maxSendable: this.config.maxSendableSats * 1000,
        metadata,
        commentAllowed: 255,
      };
    }
  }
}
