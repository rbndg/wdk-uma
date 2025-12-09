/**
 * Tenant User
 */

export class TenantUser {

  constructor(opts) {
    this.id = opts.id;
    this.username = opts.username
    this.addresses = opts.addresses
    this.sparkPublicKey = opts.sparkPublicKey
    this.createdAt = opts.createdAt
    this.updatedAt = opts.updatedAt
    this.status = opts.status

  }

  /**
   * Convert to plain object for storage
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }


  /**
   * Check if tenant is active
   * @returns {boolean}
   */
  isActive() {
    return this.status === 'active';
  }
}
