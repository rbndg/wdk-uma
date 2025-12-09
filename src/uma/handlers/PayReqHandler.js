/**
 * Pay Request Handler
 *
 * Handles POST /api/uma/payreq/:callbackId
 * Processes pay requests and generates Lightning invoices.
 */

import * as uma from '@uma-sdk/core';
import { BaseHandler } from './BaseHandler.js';
import { CurrencyHelper } from '../currency-helper.js';

export class PayReqHandler extends BaseHandler {
  /**
   * @param {import('../UmaConfig.js').UmaConfig} config
   * @param {CurrencyHelper} [currencyHelper]
   */
  constructor(config, currencyHelper = new CurrencyHelper()) {
    super(config);
    this.currencyHelper = currencyHelper;
  }

  /**
   * Handle the pay request
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   */
  async handle(request, reply) {
    const { callbackId } = request.params;

    try {
      // Get receiver info
      const receiver = await this.config.getReceiverByCallbackId(callbackId);
      if (!receiver) {
        return this.sendError(reply, 404, 'Receiver not found');
      }

      // Parse the pay request
      let payRequest;
      try {
        payRequest = uma.PayRequest.parse(request.body);
      } catch (parseError) {
        this.logError(request, parseError, 'Failed to parse pay request');
        return this.sendError(reply, 400, 'Invalid pay request format');
      }

      // Check if this is a UMA pay request
      const isUmaPayRequest = payRequest.isUma();

      if (isUmaPayRequest) {
        // Verify signature
        const signatureValid = await this.verifyPayReqSignature(request, payRequest);
        if (!signatureValid) {
          return this.sendError(reply, 400, 'Invalid pay request signature');
        }

        // Handle travel rule info
        await this.handleTravelRuleInfo(request, payRequest, receiver);
      }

      // Process the payment
      const { amountMsats, conversionInfo, receivingCurrency } = await this.calculateAmount(payRequest);

      // Create metadata and invoice
      const vaspDomain = await this.config.getVaspDomain();
      const receiverAddress = `$${receiver.username}@${vaspDomain}`;
      const metadata = JSON.stringify([
        ['text/plain', `Payment to ${receiverAddress}`],
        ['text/identifier', receiverAddress],
      ]);

      const invoice = await this.config.createInvoice(amountMsats, metadata, receiver);

      // Build and send response
      if (isUmaPayRequest) {
        const response = await this.buildUmaResponse(
          payRequest,
          invoice,
          metadata,
          receivingCurrency,
          conversionInfo,
          receiver
        );

        // Record payment for compliance
        await this.config.recordPayment({
          payRequest,
          response,
          receiver,
          amountMsats,
        });

        return reply.send(response.toJsonSchemaObject());
      } else {
        return reply.send({
          pr: invoice,
          routes: [],
          disposable: true,
        });
      }
    } catch (error) {
      this.logError(request, error, 'Pay request failed');
      return this.sendError(reply, 500, 'Internal server error');
    }
  }

  /**
   * Verify pay request signature
   * @param {Object} request - Fastify request object
   * @param {Object} payRequest - Parsed pay request
   * @returns {Promise<boolean>}
   */
  async verifyPayReqSignature(request, payRequest) {
    try {
      const senderVaspDomain = payRequest.payerData?.compliance?.nodePubKey
        ? null
        : payRequest.payerData?.identifier?.split('@')[1];

      if (!senderVaspDomain) {
        return true; // No domain to verify against
      }

      const senderPubKeys = await uma.fetchPublicKeyForVasp({
        cache: this.config.pubKeyCache,
        vaspDomain: senderVaspDomain,
      });

      const isSignatureValid = await uma.verifyPayReqSignature(
        payRequest,
        senderPubKeys,
        this.config.nonceCache
      );

      return isSignatureValid;
    } catch (error) {
      this.logError(request, error, 'Pay request signature verification failed');
      return false;
    }
  }

  /**
   * Handle encrypted travel rule info
   * @param {Object} request - Fastify request object
   * @param {Object} payRequest - Parsed pay request
   * @param {Object} receiver - Receiver object
   */
  async handleTravelRuleInfo(request, payRequest, receiver) {
    if (!payRequest.payerData?.compliance?.encryptedTravelRuleInfo) {
      return;
    }

    try {
      const encryptionPrivateKey = await this.config.getEncryptionPrivateKey();
      const travelRuleInfo = await uma.decryptTravelRuleInfo(
        payRequest.payerData.compliance.encryptedTravelRuleInfo,
        encryptionPrivateKey
      );
      await this.config.onTravelRuleInfo(travelRuleInfo, payRequest, receiver);
    } catch (error) {
      this.logError(request, error, 'Failed to decrypt travel rule info');
      // Continue processing - travel rule decryption failure may not be fatal
    }
  }

  /**
   * Calculate amount in millisatoshis
   * @param {Object} payRequest - Parsed pay request
   * @returns {Promise<{amountMsats: number, conversionInfo: Object|null, receivingCurrency: string}>}
   */
  async calculateAmount(payRequest) {
    const { amount, currency } = this.currencyHelper.parseAmount(payRequest);
    const receivingCurrency = payRequest.receivingCurrencyCode || 'SAT';

    let receivingAmount = amount;
    let conversionInfo = null;

    if (currency && currency !== receivingCurrency) {
      const rate = await this.config.getConversionRate(currency, receivingCurrency);
      receivingAmount = Math.round(amount * rate);
      conversionInfo = {
        currencyCode: receivingCurrency,
        amount: receivingAmount,
        multiplier: rate,
        decimals: this.currencyHelper.getDecimals(receivingCurrency),
        fee: 0,
      };
    }

    const amountMsats = this.currencyHelper.isBitcoinCurrency(receivingCurrency)
      ? receivingAmount * 1000
      : await this.currencyHelper.convertToMsats(
          receivingAmount,
          receivingCurrency,
          this.config.getConversionRate.bind(this.config)
        );

    return { amountMsats, conversionInfo, receivingCurrency };
  }

  /**
   * Build UMA-compliant response
   * @param {Object} payRequest - Parsed pay request
   * @param {string} invoice - BOLT11 invoice
   * @param {string} metadata - JSON metadata
   * @param {string} receivingCurrency - Receiving currency code
   * @param {Object|null} conversionInfo - Conversion info
   * @param {Object} receiver - Receiver object
   * @returns {Promise<Object>}
   */
  async buildUmaResponse(payRequest, invoice, metadata, receivingCurrency, conversionInfo, receiver) {
    const signingPrivateKey = await this.config.getSigningPrivateKey();
    const utxoCallback = await this.config.getUtxoCallback();

    return await uma.getPayReqResponse({
      request: payRequest,
      invoiceCreator: {
        createInvoice: async () => invoice,
      },
      metadata,
      receivingCurrencyCode: receivingCurrency,
      receivingCurrencyDecimals: this.currencyHelper.getDecimals(receivingCurrency),
      conversionRate: conversionInfo?.multiplier || 1,
      receiverFeesMillisats: 0,
      receiverChannelUtxos: receiver.channelUtxos || [],
      receiverNodePubKey: receiver.nodePubKey,
      utxoCallback,
      privateKeyBytes: signingPrivateKey,
    });
  }
}
