import { LnurlpResponse, Currency, KycStatus } from '@uma-sdk/core';

/**
 * Builder class for creating LnurlpResponse objects with a fluent API.
 * Simplifies the construction of LNURLP responses for UMA protocol.
 */
export class LnurlpResponseBuilder {
  constructor() {
    this._callback = '';
    this._minSendable = 0;
    this._maxSendable = 0;
    this._metadata = '';
    this._compliance = undefined;
    this._umaVersion = undefined;
    this._currencies = undefined;
    this._payerData = undefined;
    this._commentAllowed = undefined;
    this._nostrPubkey = undefined;
    this._allowsNostr = undefined;
    this._settlementOptions = undefined;
  }

  /**
   * Set the callback URL for the pay request
   * @param {string} url - The callback URL
   * @returns {LnurlpResponseBuilder}
   */
  setCallback(url) {
    this._callback = url;
    return this;
  }

  /**
   * Set the minimum sendable amount in millisatoshis
   * @param {number} amount - Minimum amount in millisatoshis
   * @returns {LnurlpResponseBuilder}
   */
  setMinSendable(amount) {
    this._minSendable = amount;
    return this;
  }

  /**
   * Set the maximum sendable amount in millisatoshis
   * @param {number} amount - Maximum amount in millisatoshis
   * @returns {LnurlpResponseBuilder}
   */
  setMaxSendable(amount) {
    this._maxSendable = amount;
    return this;
  }

  /**
   * Set both min and max sendable amounts
   * @param {number} min - Minimum amount in millisatoshis
   * @param {number} max - Maximum amount in millisatoshis
   * @returns {LnurlpResponseBuilder}
   */
  setMinMaxSendable(min, max) {
    this._minSendable = min;
    this._maxSendable = max;
    return this;
  }

  /**
   * Set the metadata JSON string
   * @param {string} metadata - JSON-encoded metadata
   * @returns {LnurlpResponseBuilder}
   */
  setMetadata(metadata) {
    this._metadata = metadata;
    return this;
  }

  /**
   * Set the UMA protocol version
   * @param {string} version - UMA version string (e.g., "1.0")
   * @returns {LnurlpResponseBuilder}
   */
  setUmaVersion(version) {
    this._umaVersion = version;
    return this;
  }

  /**
   * Set the compliance response data
   * @param {Object} compliance - Compliance data object
   * @param {string} compliance.kycStatus - KYC status (UNKNOWN, NOT_VERIFIED, PENDING, VERIFIED)
   * @param {string} compliance.signature - Base64-encoded signature
   * @param {string} compliance.signatureNonce - Nonce used in signature
   * @param {number} compliance.signatureTimestamp - Unix timestamp of signature
   * @param {boolean} compliance.isSubjectToTravelRule - Whether travel rule applies
   * @param {string} compliance.receiverIdentifier - Receiver's UMA identifier
   * @param {Array} [compliance.backingSignatures] - Optional backing signatures
   * @returns {LnurlpResponseBuilder}
   */
  setCompliance(compliance) {
    this._compliance = compliance;
    return this;
  }

  /**
   * Set the list of supported currencies
   * @param {Currency[]} currencies - Array of Currency objects
   * @returns {LnurlpResponseBuilder}
   */
  setCurrencies(currencies) {
    this._currencies = currencies;
    return this;
  }

  /**
   * Add a single currency to the list
   * @param {Currency} currency - Currency object to add
   * @returns {LnurlpResponseBuilder}
   */
  addCurrency(currency) {
    if (!this._currencies) {
      this._currencies = [];
    }
    this._currencies.push(currency);
    return this;
  }

  /**
   * Set the payer data options (what data is required/optional from sender)
   * @param {Object} payerData - Record of field name to {mandatory: boolean}
   * @returns {LnurlpResponseBuilder}
   */
  setPayerData(payerData) {
    this._payerData = payerData;
    return this;
  }

  /**
   * Set the number of characters allowed in comments
   * @param {number} length - Maximum comment length
   * @returns {LnurlpResponseBuilder}
   */
  setCommentAllowed(length) {
    this._commentAllowed = length;
    return this;
  }

  /**
   * Set nostr-related options for NIP-57 zaps
   * @param {string} pubkey - BIP-340 public key in hex format
   * @param {boolean} [allowsNostr=true] - Whether nostr zaps are allowed
   * @returns {LnurlpResponseBuilder}
   */
  setNostr(pubkey, allowsNostr = true) {
    this._nostrPubkey = pubkey;
    this._allowsNostr = allowsNostr;
    return this;
  }

  /**
   * Set settlement options for the response
   * @param {Array} options - Array of settlement options
   * @returns {LnurlpResponseBuilder}
   */
  setSettlementOptions(options) {
    this._settlementOptions = options;
    return this;
  }

  /**
   * Build the LnurlpResponse object
   * @returns {LnurlpResponse}
   * @throws {Error} If required fields are missing
   */
  build() {
    if (!this._callback) {
      throw new Error('callback is required');
    }
    if (this._minSendable === undefined || this._minSendable < 0) {
      throw new Error('minSendable must be a non-negative number');
    }
    if (this._maxSendable === undefined || this._maxSendable < 0) {
      throw new Error('maxSendable must be a non-negative number');
    }
    if (!this._metadata) {
      throw new Error('metadata is required');
    }

    return new LnurlpResponse(
      this._callback,
      this._minSendable,
      this._maxSendable,
      this._metadata,
      this._compliance,
      this._umaVersion,
      this._currencies,
      this._payerData,
      this._commentAllowed,
      this._nostrPubkey,
      this._allowsNostr,
      this._settlementOptions
    );
  }
}

/**
 * Factory function to create a Currency object
 * @param {string} code - Currency code (e.g., "USD")
 * @param {string} name - Full currency name (e.g., "US Dollars")
 * @param {string} symbol - Currency symbol (e.g., "$")
 * @param {number} multiplier - Millisats per smallest unit
 * @param {number} minSendable - Minimum sendable in smallest units
 * @param {number} maxSendable - Maximum sendable in smallest units
 * @param {number} decimals - Number of decimal places
 * @returns {Currency}
 */
export function createCurrency(code, name, symbol, multiplier, minSendable, maxSendable, decimals) {
  return new Currency(code, name, symbol, multiplier, minSendable, maxSendable, decimals);
}

/**
 * Create a compliance response object for UMA
 * @param {Object} options - Compliance options
 * @param {string} options.receiverIdentifier - Receiver's UMA address
 * @param {string} options.kycStatus - KYC status
 * @param {string} options.signature - Base64 signature
 * @param {string} options.signatureNonce - Nonce for signature
 * @param {number} options.signatureTimestamp - Unix timestamp
 * @param {boolean} options.isSubjectToTravelRule - Travel rule requirement
 * @param {Array} [options.backingSignatures] - Optional backing signatures
 * @returns {Object} LnurlComplianceResponse object
 */
export function createComplianceResponse(options) {
  return {
    kycStatus: options.kycStatus || KycStatus.Unknown,
    signature: options.signature,
    signatureNonce: options.signatureNonce,
    signatureTimestamp: options.signatureTimestamp,
    isSubjectToTravelRule: options.isSubjectToTravelRule ?? false,
    receiverIdentifier: options.receiverIdentifier,
    backingSignatures: options.backingSignatures,
  };
}

/**
 * Create payer data options specifying required/optional fields
 * @param {Object} options - Options object where keys are field names
 * @param {boolean} [options.identifier] - Whether identifier is mandatory
 * @param {boolean} [options.name] - Whether name is mandatory
 * @param {boolean} [options.email] - Whether email is mandatory
 * @param {boolean} [options.compliance] - Whether compliance is mandatory
 * @returns {Object} CounterPartyDataOptions object
 */
export function createPayerDataOptions(options = {}) {
  const result = {};

  for (const [key, mandatory] of Object.entries(options)) {
    result[key] = { mandatory: Boolean(mandatory) };
  }

  return result;
}

/**
 * Create a settlement option
 * @param {string} settlementLayer - The settlement layer name (e.g., "ln", "spark")
 * @param {Array} assets - Array of settlement assets
 * @returns {Object} SettlementOption object
 */
export function createSettlementOption(settlementLayer, assets) {
  return {
    settlementLayer,
    assets,
  };
}

/**
 * Create a settlement asset
 * @param {string} identifier - Asset identifier (e.g., "BTC")
 * @param {Object} multipliers - Record of currency code to multiplier
 * @returns {Object} SettlementAsset object
 */
export function createSettlementAsset(identifier, multipliers) {
  return {
    identifier,
    multipliers,
  };
}
