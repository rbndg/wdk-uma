/**
 * Tenant UMA Configuration
 *
 * A tenant-aware implementation of UmaConfig that uses
 * tenant configuration from TenantManager.
 */

import { UmaConfig } from '../uma/UmaConfig.js';

/**
 * UMA configuration for a specific tenant
 */
export class TenantUmaConfig extends UmaConfig {
  /**
   * @param {Object} options
   * @param {import('./Tenant.js').Tenant} options.tenant - Tenant instance
   * @param {Object} options.db - Database connection/client
   * @param {Function} options.invoiceCreator - (amountMsats, metadata, receiver, tenant) => invoice string
   * @param {Function} [options.rateProvider] - (from, to, tenant) => conversion rate
   */
  constructor(options) {
    super({
      minSendableSats: options.tenant.minSendableSats,
      maxSendableSats: options.tenant.maxSendableSats,
      nonceCache: options.nonceCache,
      pubKeyCache: options.pubKeyCache,
    });

    this.tenant = options.tenant;
    this.invoiceCreator = options.invoiceCreator;
    this.rateProvider = options.rateProvider;
  }

  // ============================================
  // Key Management
  // ============================================

  async getSigningPrivateKey() {
    return this.tenant.keys.signingPrivateKey;
  }

  async getSigningPublicKey() {
    return this.tenant.keys.signingPublicKey;
  }

  async getEncryptionPrivateKey() {
    return this.tenant.keys.encryptionPrivateKey;
  }

  async getEncryptionPublicKey() {
    return this.tenant.keys.encryptionPublicKey;
  }

  // ============================================
  // User/Receiver Lookup
  // ============================================

  async getUserByUsername(username) {
    return await this.tenant.getUser(username)
  }

  async getReceiverByCallbackId(cid) {
    return await this.tenant.getReceiverByCallbackId(cid)
  }

  // ============================================
  // VASP Configuration
  // ============================================

  async getVaspDomain() {
    return this.tenant.domain;
  }

  async getCallbackUrl(username) {
    return `${this.tenant.baseUrl}/api/uma/payreq/${username}`;
  }

  async getUtxoCallback() {
    return `${this.tenant.baseUrl}/api/uma/utxocallback`;
  }

  // ============================================
  // Currency Configuration
  // ============================================

  async getCurrencies() {
    return this.tenant.currencies;
  }

  async getPayerDataOptions() {
    return this.tenant.payerDataOptions;
  }

  async getConversionRate(fromCurrency, toCurrency) {
    if (this.rateProvider) {
      return await this.rateProvider(fromCurrency, toCurrency, this.tenant);
    }

    if (fromCurrency === toCurrency) {
      return 1;
    }

    throw new Error(`No rate provider configured for ${fromCurrency} -> ${toCurrency}`);
  }

  // ============================================
  // Invoice Creation
  // ============================================

  async createInvoice(amountMsats, metadata, receiver) {
    if (!this.invoiceCreator) {
      throw new Error('Invoice creator not configured');
    }
    return await this.invoiceCreator(amountMsats, metadata, receiver, this.tenant);
  }

  // ============================================
  // Callbacks
  // ============================================

  async onTravelRuleInfo(travelRuleInfo, payRequest, receiver) {
    // Override for custom handling
  }

  async onUtxosReceived(utxos, vaspDomain) {
    // Override for custom handling
  }

  async recordPayment(paymentData) {
    return this.tenant.recordPayment(paymentData)
  }

  async recordUtxos(utxoData) {
    return this.tenant.recordPayment(utxoData)
  }
}
