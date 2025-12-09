/**
 * Currency Helper
 *
 * Utility class for currency parsing, conversion, and formatting.
 */

/**
 * Default decimal places for common currencies
 */
const DEFAULT_DECIMALS = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  SAT: 0,
  BTC: 8,
  MXN: 2,
  BRL: 2,
  JPY: 0,
  CNY: 2,
  KRW: 0,
  INR: 2,
  AUD: 2,
  CAD: 2,
  CHF: 2,
};

export class CurrencyHelper {
  /**
   * @param {Object} options
   * @param {Object} [options.customDecimals] - Custom decimal places for currencies
   */
  constructor(options = {}) {
    this.decimals = { ...DEFAULT_DECIMALS, ...options.customDecimals };
  }

  /**
   * Parse amount from pay request (handles both V0 and V1 formats)
   *
   * @param {Object} payRequest - The pay request object
   * @returns {{ amount: number, currency: string|null }}
   */
  parseAmount(payRequest) {
    const amountStr = payRequest.amount;

    if (typeof amountStr === 'number') {
      // V0 format: amount in millisats
      return { amount: amountStr, currency: null };
    }

    if (typeof amountStr === 'string') {
      // V1 format: "amount" or "amount.CURRENCY"
      const parts = amountStr.split('.');
      if (parts.length === 2) {
        return { amount: parseInt(parts[0], 10), currency: parts[1] };
      }
      return { amount: parseInt(amountStr, 10), currency: null };
    }

    return { amount: 0, currency: null };
  }

  /**
   * Get decimal places for a currency
   *
   * @param {string} currency - Currency code
   * @returns {number} Number of decimal places
   */
  getDecimals(currency) {
    return this.decimals[currency] ?? 2;
  }

  /**
   * Set decimal places for a currency
   *
   * @param {string} currency - Currency code
   * @param {number} decimals - Number of decimal places
   */
  setDecimals(currency, decimals) {
    this.decimals[currency] = decimals;
  }

  /**
   * Convert amount to millisatoshis
   *
   * @param {number} amount - Amount in source currency smallest units
   * @param {string} currency - Source currency code
   * @param {Function} getConversionRate - (from, to) => rate
   * @returns {Promise<number>} Amount in millisatoshis
   */
  async convertToMsats(amount, currency, getConversionRate) {
    if (currency === 'SAT') {
      return amount * 1000;
    }
    if (currency === 'BTC') {
      // BTC amount is in satoshis (smallest unit)
      return amount * 1000;
    }
    const rate = await getConversionRate(currency, 'SAT');
    return Math.round(amount * rate * 1000);
  }

  /**
   * Convert millisatoshis to a target currency
   *
   * @param {number} msats - Amount in millisatoshis
   * @param {string} targetCurrency - Target currency code
   * @param {Function} getConversionRate - (from, to) => rate
   * @returns {Promise<number>} Amount in target currency smallest units
   */
  async convertFromMsats(msats, targetCurrency, getConversionRate) {
    if (targetCurrency === 'SAT') {
      return Math.round(msats / 1000);
    }
    if (targetCurrency === 'BTC') {
      return Math.round(msats / 1000);
    }
    const rate = await getConversionRate('SAT', targetCurrency);
    return Math.round((msats / 1000) * rate);
  }

  /**
   * Format amount with currency symbol
   *
   * @param {number} amount - Amount in smallest units
   * @param {string} currency - Currency code
   * @param {string} [symbol] - Currency symbol (optional)
   * @returns {string} Formatted amount string
   */
  formatAmount(amount, currency, symbol = '') {
    const decimals = this.getDecimals(currency);
    const divisor = Math.pow(10, decimals);
    const formatted = (amount / divisor).toFixed(decimals);
    return symbol ? `${symbol}${formatted}` : `${formatted} ${currency}`;
  }

  /**
   * Parse a formatted amount string to smallest units
   *
   * @param {string} formatted - Formatted amount string (e.g., "10.50")
   * @param {string} currency - Currency code
   * @returns {number} Amount in smallest units
   */
  parseFormattedAmount(formatted, currency) {
    const decimals = this.getDecimals(currency);
    const multiplier = Math.pow(10, decimals);
    const cleaned = formatted.replace(/[^0-9.]/g, '');
    return Math.round(parseFloat(cleaned) * multiplier);
  }

  /**
   * Check if currency is a Bitcoin-based currency
   *
   * @param {string} currency - Currency code
   * @returns {boolean}
   */
  isBitcoinCurrency(currency) {
    return currency === 'SAT' || currency === 'BTC' || currency === 'MSAT';
  }
}

// Export singleton instance for convenience
export const currencyHelper = new CurrencyHelper();
