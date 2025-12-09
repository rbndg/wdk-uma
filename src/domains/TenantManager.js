/**
 * Tenant Manager
 *
 * Manages tenants in the multi-tenant UMA system.
 * Provides interface for adding, removing, and retrieving tenants.
 */

import { Tenant } from './Tenant.js';

/**
 * @typedef {Object} TenantManagerOptions
 * @property {Object} db - Database connection/client
 * @property {string} [tenantsTable='tenants'] - Tenants table/collection name
 * @property {string} [keysTable='tenant_keys'] - Tenant keys table/collection name
 * @property {Function} [encryptKeys] - (keys) => encrypted keys for storage
 * @property {Function} [decryptKeys] - (encryptedKeys) => decrypted keys
 */

export class TenantManager {
  /**
   * @param {TenantManagerOptions} options
   */
  constructor(options) {
    this.tenantsTable = options.tenantsTable || 'tenants';

    this.db = options.dbClient.db(this.tenantsTable)
    this.keysTable = options.keysTable || 'tenant_keys';
    this.encryptKeys = options.encryptKeys || ((keys) => keys);
    this.decryptKeys = options.decryptKeys || ((keys) => keys);

    // In-memory cache of active tenants
    this._cache = new Map();
    this._cacheByDomain = new Map();
  }

  /**
   * Initialize the tenant manager
   * Creates indexes and loads active tenants into cache
   */
  async initialize() {
    // Create indexes
    await this.db.collection(this.tenantsTable).createIndex({ id: 1 }, { unique: true });
    await this.db.collection(this.tenantsTable).createIndex({ domain: 1 }, { unique: true });
    await this.db.collection(this.tenantsTable).createIndex({ active: 1 });
    await this.db.collection(this.keysTable).createIndex({ tenantId: 1 }, { unique: true });

    // Load active tenants into cache
    await this.refreshCache();
  }

  /**
   * Refresh the in-memory cache of tenants
   */
  async refreshCache() {
    this._cache.clear();
    this._cacheByDomain.clear();

    const tenantDocs = await this.db
      .collection(this.tenantsTable)
      .find({ active: true })
      .toArray();

    for (const doc of tenantDocs) {
      const keys = await this._loadKeys(doc.id);
      if (keys) {
        const tenant = Tenant.fromDocument(doc, keys);
        this._cache.set(tenant.id, tenant);
        this._cacheByDomain.set(tenant.domain, tenant);
      }
    }
  }

  /**
   * Add a new tenant
   * @param {Object} config - Tenant configuration
   * @returns {Promise<Tenant>}
   */
  async addTenant(config) {
    // Validate required fields
    if (!config.id) throw new Error('Tenant id is required');
    if (!config.name) throw new Error('Tenant name is required');
    if (!config.domain) throw new Error('Tenant domain is required');
    if (!config.keys) throw new Error('Tenant keys are required');

    // Check for existing tenant
    const existing = await this.db.collection(this.tenantsTable).findOne({
      $or: [{ id: config.id }, { domain: config.domain }],
    });

    if (existing) {
      if (existing.id === config.id) {
        throw new Error(`Tenant with id "${config.id}" already exists`);
      }
      throw new Error(`Tenant with domain "${config.domain}" already exists`);
    }

    const tenant = new Tenant(config);

    // Store tenant (without private keys)
    await this.db.collection(this.tenantsTable).insertOne(tenant.toJSON());

    // Store keys separately (encrypted)
    await this._saveKeys(tenant.id, config.keys);

    // Add to cache if active
    if (tenant.isActive()) {
      this._cache.set(tenant.id, tenant);
      this._cacheByDomain.set(tenant.domain, tenant);
    }

    return tenant;
  }

  /**
   * Remove a tenant
   * @param {string} tenantId - Tenant ID to remove
   * @returns {Promise<boolean>}
   */
  async removeTenant(tenantId) {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      return false;
    }

    // Remove from database
    await this.db.collection(this.tenantsTable).deleteOne({ id: tenantId });
    await this.db.collection(this.keysTable).deleteOne({ tenantId });

    // Remove from cache
    this._cache.delete(tenantId);
    this._cacheByDomain.delete(tenant.domain);

    return true;
  }

  /**
   * Get a tenant by ID
   * @param {string} tenantId - Tenant ID
   * @param {boolean} [useCache=true] - Whether to use cache
   * @returns {Promise<Tenant|null>}
   */
  async getTenant(tenantId, useCache = true) {
    // Check cache first
    if (useCache && this._cache.has(tenantId)) {
      return this._cache.get(tenantId);
    }

    // Load from database
    const doc = await this.db.collection(this.tenantsTable).findOne({ id: tenantId });
    if (!doc) {
      return null;
    }

    const keys = await this._loadKeys(tenantId);
    if (!keys) {
      return null;
    }

    const tenant = Tenant.fromDocument(doc, keys);

    // Update cache if active
    if (tenant.isActive()) {
      this._cache.set(tenant.id, tenant);
      this._cacheByDomain.set(tenant.domain, tenant);
    }

    return tenant;
  }

  /**
   * Get a tenant by domain
   * @param {string} domain - Tenant domain
   * @param {boolean} [useCache=true] - Whether to use cache
   * @returns {Promise<Tenant|null>}
   */
  async getTenantByDomain(domain, useCache = true) {
    // Check cache first
    if (useCache && this._cacheByDomain.has(domain)) {
      return this._cacheByDomain.get(domain);
    }

    // Load from database
    const doc = await this.db.collection(this.tenantsTable).findOne({ domain });
    if (!doc) {
      return null;
    }

    const keys = await this._loadKeys(doc.id);
    if (!keys) {
      return null;
    }

    const tenant = Tenant.fromDocument(doc, keys);

    // Update cache if active
    if (tenant.isActive()) {
      this._cache.set(tenant.id, tenant);
      this._cacheByDomain.set(tenant.domain, tenant);
    }

    return tenant;
  }

  /**
   * Update a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Tenant|null>}
   */
  async updateTenant(tenantId, updates) {
    const tenant = await this.getTenant(tenantId, false);
    if (!tenant) {
      return null;
    }

    const oldDomain = tenant.domain;

    // Update tenant object
    tenant.update(updates);

    // Update database
    await this.db.collection(this.tenantsTable).updateOne(
      { id: tenantId },
      { $set: tenant.toJSON() }
    );

    // Update keys if provided
    if (updates.keys) {
      await this._saveKeys(tenantId, updates.keys);
    }

    // Update cache
    if (tenant.isActive()) {
      this._cache.set(tenant.id, tenant);
      // Update domain cache if domain changed
      if (oldDomain !== tenant.domain) {
        this._cacheByDomain.delete(oldDomain);
      }
      this._cacheByDomain.set(tenant.domain, tenant);
    } else {
      // Remove from cache if deactivated
      this._cache.delete(tenant.id);
      this._cacheByDomain.delete(tenant.domain);
    }

    return tenant;
  }

  /**
   * Activate a tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Tenant|null>}
   */
  async activateTenant(tenantId) {
    return this.updateTenant(tenantId, { active: true });
  }

  /**
   * Deactivate a tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Tenant|null>}
   */
  async deactivateTenant(tenantId) {
    return this.updateTenant(tenantId, { active: false });
  }

  /**
   * List all tenants
   * @param {Object} [filter] - Optional filter
   * @param {boolean} [filter.active] - Filter by active status
   * @returns {Promise<Tenant[]>}
   */
  async listTenants(filter = {}) {
    const query = {};
    if (filter.active !== undefined) {
      query.active = filter.active;
    }

    const docs = await this.db.collection(this.tenantsTable).find(query).toArray();
    const tenants = [];

    for (const doc of docs) {
      const keys = await this._loadKeys(doc.id);
      if (keys) {
        tenants.push(Tenant.fromDocument(doc, keys));
      }
    }

    return tenants;
  }

  /**
   * Get all active tenants from cache
   * @returns {Tenant[]}
   */
  getActiveTenants() {
    return Array.from(this._cache.values());
  }

  /**
   * Check if a tenant exists
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<boolean>}
   */
  async tenantExists(tenantId) {
    if (this._cache.has(tenantId)) {
      return true;
    }
    const doc = await this.db.collection(this.tenantsTable).findOne({ id: tenantId });
    return doc !== null;
  }

  /**
   * Check if a domain is registered
   * @param {string} domain - Domain to check
   * @returns {Promise<boolean>}
   */
  async domainExists(domain) {
    if (this._cacheByDomain.has(domain)) {
      return true;
    }
    const doc = await this.db.collection(this.tenantsTable).findOne({ domain });
    return doc !== null;
  }

  /**
   * Save tenant keys (encrypted)
   * @private
   */
  async _saveKeys(tenantId, keys) {
    const encryptedKeys = await this.encryptKeys({
      signingPrivateKey: Array.from(keys.signingPrivateKey),
      signingPublicKey: keys.signingPublicKey,
      encryptionPrivateKey: Array.from(keys.encryptionPrivateKey),
      encryptionPublicKey: keys.encryptionPublicKey,
    });

    await this.db.collection(this.keysTable).updateOne(
      { tenantId },
      { $set: { tenantId, keys: encryptedKeys, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  /**
   * Load tenant keys (decrypted)
   * @private
   */
  async _loadKeys(tenantId) {
    const doc = await this.db.collection(this.keysTable).findOne({ tenantId });
    if (!doc) {
      return null;
    }

    const decryptedKeys = await this.decryptKeys(doc.keys);
    return {
      signingPrivateKey: new Uint8Array(decryptedKeys.signingPrivateKey),
      signingPublicKey: decryptedKeys.signingPublicKey,
      encryptionPrivateKey: new Uint8Array(decryptedKeys.encryptionPrivateKey),
      encryptionPublicKey: decryptedKeys.encryptionPublicKey,
    };
  }
}
