/**
 * UMA Configuration Class
 *
 * Provides all configuration and dependencies needed for UMA handlers.
 * Extend this class and implement the abstract methods for your VASP.
 */

import { InMemoryNonceValidator, KycStatus } from '@uma-sdk/core';

/**
 * Abstract base class for UMA configuration.
 * Implement all methods for your specific VASP setup.
 */
export class UmaConfig {
  constructor(options = {}) {
    this.minSendableSats = options.minSendableSats ?? 1;
    this.maxSendableSats = options.maxSendableSats ?? 10000000;
    this.pubKeyCache = options.pubKeyCache ?? undefined;

    // Initialize nonce cache (default: 2 days)
    const nonceExpiry = options.nonceExpiryMs ?? 2 * 24 * 60 * 60 * 1000;
    this.nonceCache = options.nonceCache ?? new InMemoryNonceValidator(Date.now() - nonceExpiry);
  }

  // ============================================
  // Key Management - MUST IMPLEMENT
  // ============================================

  /**
   * Get the signing private key
   * @returns {Promise<Uint8Array>} Signing private key bytes
   */
  async getSigningPrivateKey() {
    throw new Error('getSigningPrivateKey() must be implemented');
  }

  /**
   * Get the signing public key
   * @returns {Promise<string>} Hex-encoded signing public key
   */
  async getSigningPublicKey() {
    throw new Error('getSigningPublicKey() must be implemented');
  }

  /**
   * Get the encryption private key
   * @returns {Promise<Uint8Array>} Encryption private key bytes
   */
  async getEncryptionPrivateKey() {
    throw new Error('getEncryptionPrivateKey() must be implemented');
  }

  /**
   * Get the encryption public key
   * @returns {Promise<string>} Hex-encoded encryption public key
   */
  async getEncryptionPublicKey() {
    throw new Error('getEncryptionPublicKey() must be implemented');
  }

  // ============================================
  // Optional Certificate Chain Methods
  // ============================================

  /**
   * Get X.509 certificate chain for signing (optional)
   * @returns {Promise<string[]|null>} Certificate chain or null
   */
  async getSigningCertChain() {
    return null;
  }

  /**
   * Get X.509 certificate chain for encryption (optional)
   * @returns {Promise<string[]|null>} Certificate chain or null
   */
  async getEncryptionCertChain() {
    return null;
  }

  /**
   * Get key expiration timestamp (optional)
   * @returns {Promise<number|null>} Unix timestamp or null
   */
  async getExpirationTimestamp() {
    return null;
  }

  // ============================================
  // User/Receiver Lookup - MUST IMPLEMENT
  // ============================================

  /**
   * Look up a user by username
   * @param {string} username - The username to look up
   * @returns {Promise<Object|null>} User object or null if not found
   *
   * User object should contain:
   * - username: string
   * - kycStatus: KycStatus (optional, defaults to Verified)
   * - requiresTravelRule: boolean (optional, defaults to true)
   * - channelUtxos: string[] (optional)
   * - nodePubKey: string (optional)
   */
  async getUserByUsername(username) {
    throw new Error('getUserByUsername() must be implemented');
  }

  /**
   * Look up a receiver by callback ID
   * @param {string} callbackId - The callback ID from the pay request URL
   * @returns {Promise<Object|null>} Receiver object or null if not found
   */
  async getReceiverByCallbackId(callbackId) {
    throw new Error('getReceiverByCallbackId() must be implemented');
  }

  // ============================================
  // VASP Configuration - MUST IMPLEMENT
  // ============================================

  /**
   * Get this VASP's domain
   * @returns {Promise<string>} VASP domain (e.g., "vasp.example.com")
   */
  async getVaspDomain() {
    throw new Error('getVaspDomain() must be implemented');
  }

  /**
   * Get the callback URL for pay requests
   * @param {string} username - The receiver's username
   * @returns {Promise<string>} Full callback URL
   */
  async getCallbackUrl(username) {
    throw new Error('getCallbackUrl() must be implemented');
  }

  /**
   * Get the UTXO callback URL
   * @returns {Promise<string>} Full UTXO callback URL
   */
  async getUtxoCallback() {
    throw new Error('getUtxoCallback() must be implemented');
  }

  // ============================================
  // Currency Configuration - MUST IMPLEMENT
  // ============================================

  /**
   * Get supported currencies
   * @returns {Promise<Currency[]>} Array of Currency objects
   */
  async getCurrencies() {
    throw new Error('getCurrencies() must be implemented');
  }

  /**
   * Get payer data requirements
   * @returns {Promise<Object>} CounterPartyDataOptions object
   */
  async getPayerDataOptions() {
    return {
      identifier: { mandatory: true },
      name: { mandatory: false },
      email: { mandatory: false },
      compliance: { mandatory: true },
    };
  }

  /**
   * Get conversion rate between currencies
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Promise<number>} Conversion multiplier
   */
  async getConversionRate(fromCurrency, toCurrency) {
    throw new Error('getConversionRate() must be implemented');
  }

  // ============================================
  // Invoice Creation - MUST IMPLEMENT
  // ============================================

  /**
   * Create a Lightning invoice
   * @param {number} amountMsats - Amount in millisatoshis
   * @param {string} metadata - JSON-encoded metadata
   * @param {Object} receiver - Receiver user object
   * @returns {Promise<string>} BOLT11 invoice string
   */
  async createInvoice(amountMsats, metadata, receiver) {
    throw new Error('createInvoice() must be implemented');
  }

  // ============================================
  // Optional Callbacks
  // ============================================

  /**
   * Called when travel rule info is received (optional)
   * @param {Object} travelRuleInfo - Decrypted travel rule information
   * @param {Object} payRequest - The pay request object
   * @param {Object} receiver - The receiver user object
   */
  async onTravelRuleInfo(travelRuleInfo, payRequest, receiver) {
    // Override to handle travel rule info
  }

  /**
   * Called when UTXOs are received (optional)
   * @param {Array} utxos - Array of {utxo, amountMsats}
   * @param {string} vaspDomain - Domain of the sending VASP
   */
  async onUtxosReceived(utxos, vaspDomain) {
    // Override to handle UTXOs
  }

  /**
   * Record a payment for compliance (optional)
   * @param {Object} paymentData - Payment details
   */
  async recordPayment(paymentData) {
    // Override to record payments
  }

  /**
   * Record UTXOs for compliance (optional)
   * @param {Object} utxoData - UTXO details
   */
  async recordUtxos(utxoData) {
    // Override to record UTXOs
  }
}
