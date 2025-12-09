/**
 * UMA (Universal Money Address) SDK wrapper
 *
 * This module provides convenient access to UMA protocol types and builders
 * for creating LNURLP responses.
 */

// Re-export core SDK types
export {
  LnurlpResponse,
  Currency,
  KycStatus,
  kycStatusFromString,
  kycStatusToString,
} from '@uma-sdk/core';

// Export builder and factory functions
export {
  LnurlpResponseBuilder,
  createCurrency,
  createComplianceResponse,
  createPayerDataOptions,
  createSettlementOption,
  createSettlementAsset,
} from './LnurlpResponseBuilder.js';

// Re-export from types for granular imports
export * from './types.js';

// Export handler classes
export {
  BaseHandler,
  PubKeyHandler,
  LnurlpHandler,
  PayReqHandler,
  UtxoCallbackHandler,
  createUmaHandlers,
} from './handlers/index.js';

// Export configuration class
export { UmaConfig } from './UmaConfig.js';

// Export currency helper
export { CurrencyHelper, currencyHelper } from './currency-helper.js';
