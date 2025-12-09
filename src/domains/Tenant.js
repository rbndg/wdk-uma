import { TenantUmaConfig } from './TenantUmaConfig.js'

/**
 * Tenant Model
 *
 * Represents a tenant in the multi-tenant UMA system.
 */

/**
 * @typedef {Object} TenantKeys
 * @property {Uint8Array} signingPrivateKey - Signing private key
 * @property {string} signingPublicKey - Signing public key (hex)
 * @property {Uint8Array} encryptionPrivateKey - Encryption private key
 * @property {string} encryptionPublicKey - Encryption public key (hex)
 */

/**
 * @typedef {Object} TenantTables
 * @property {string} users - Users table/collection name
 * @property {string} payments - Payments table/collection name
 * @property {string} utxos - UTXOs table/collection name
 */

/**
 * @typedef {Object} TenantConfig
 * @property {string} id - Unique tenant identifier
 * @property {string} name - Tenant display name
 * @property {string} domain - VASP domain (e.g., "vasp.example.com")
 * @property {string} [baseUrl] - Base URL for callbacks
 * @property {TenantKeys} keys - Cryptographic keys
 * @property {TenantTables} [tables] - Table names (with defaults)
 * @property {Array} [currencies] - Supported currencies
 * @property {Object} [payerDataOptions] - Payer data requirements
 * @property {number} [minSendableSats] - Minimum sendable sats
 * @property {number} [maxSendableSats] - Maximum sendable sats
 * @property {boolean} [active] - Whether tenant is active
 * @property {Object} [metadata] - Additional tenant metadata
 */

export class Tenant {
  /**
   * @param {TenantConfig} config
   */
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.domain = config.domain;
    this.baseUrl = config.baseUrl || `https://${config.domain}`;
    this.keys = config.keys;
    this.tables = {
      users: config.tables?.users || `${config.id}_users`,
      payments: config.tables?.payments || `${config.id}_payments`,
      utxos: config.tables?.utxos || `${config.id}_utxos`,
    };
    this.currencies = config.currencies || [];
    this.payerDataOptions = config.payerDataOptions || {
      identifier: { mandatory: true },
      name: { mandatory: false },
      email: { mandatory: false },
      compliance: { mandatory: true },
    };
    this.minSendableSats = config.minSendableSats ?? 1;
    this.maxSendableSats = config.maxSendableSats ?? 10000000;
    this.active = config.active ?? true;
    this.metadata = config.metadata || {};
    this.createdAt = config.createdAt || new Date();
    this.updatedAt = config.updatedAt || new Date();
  }

  /**
   * Convert to plain object for storage
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      domain: this.domain,
      baseUrl: this.baseUrl,
      keys: {
        signingPublicKey: this.keys.signingPublicKey,
        encryptionPublicKey: this.keys.encryptionPublicKey,
        // Private keys stored separately or encrypted
      },
      tables: this.tables,
      currencies: this.currencies,
      payerDataOptions: this.payerDataOptions,
      minSendableSats: this.minSendableSats,
      maxSendableSats: this.maxSendableSats,
      active: this.active,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create Tenant from database document
   * @param {Object} doc - Database document
   * @param {Object} keys - Decrypted keys object
   * @returns {Tenant}
   */
  static fromDocument(doc, keys) {
    return new Tenant({
      ...doc,
      keys,
    });
  }

  /**
   * Check if tenant is active
   * @returns {boolean}
   */
  isActive() {
    return this.active === true;
  }

  /**
   * Update tenant properties
   * @param {Partial<TenantConfig>} updates
   */
  update(updates) {
    if (updates.name !== undefined) this.name = updates.name;
    if (updates.domain !== undefined) this.domain = updates.domain;
    if (updates.baseUrl !== undefined) this.baseUrl = updates.baseUrl;
    if (updates.keys !== undefined) this.keys = updates.keys;
    if (updates.tables !== undefined) this.tables = { ...this.tables, ...updates.tables };
    if (updates.currencies !== undefined) this.currencies = updates.currencies;
    if (updates.payerDataOptions !== undefined) this.payerDataOptions = updates.payerDataOptions;
    if (updates.minSendableSats !== undefined) this.minSendableSats = updates.minSendableSats;
    if (updates.maxSendableSats !== undefined) this.maxSendableSats = updates.maxSendableSats;
    if (updates.active !== undefined) this.active = updates.active;
    if (updates.metadata !== undefined) this.metadata = { ...this.metadata, ...updates.metadata };
    this.updatedAt = new Date();
  }

  async addUser(useObj) {
    
  }

  async getUser() {
  }

  async savePayment(payData) {
    return this.db.collection(this.tables.payments).insertOne({
      ...payData,
      tenantId: this.id,
      createdAt: new Date(),
    });

  }

  async getReceiverByCallbackId(callbackId) {
    return await this.db.collection(this.tables.users).findOne({
      $or: [
        { username: callbackId },
        { callbackId: callbackId },
      ],
    });
  }
  
  async recordUtxos(utxoData) {
    await this.db.collection(this.tenant.tables.utxos).insertOne({
      ...utxoData,
      tenantId: this.id,
      createdAt: new Date(),
    });
  }

  getUmaConfig() {

    return new TenantUmaConfig({
      tenant : this
    })

  }

  
}
