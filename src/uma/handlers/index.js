/**
 * UMA Handlers Index
 *
 * Export all handler classes and factory function.
 */

export { BaseHandler } from './BaseHandler.js';
export { PubKeyHandler } from './PubKeyHandler.js';
export { LnurlpHandler } from './LnurlpHandler.js';
export { PayReqHandler } from './PayReqHandler.js';
export { UtxoCallbackHandler } from './UtxoCallbackHandler.js';

/**
 * Create all UMA handlers from a UmaConfig instance
 *
 * @param {import('../UmaConfig.js').UmaConfig} config - UmaConfig instance
 * @returns {Object} Object with all handler functions ready for Fastify
 */

import { PubKeyHandler } from './PubKeyHandler.js';
import { LnurlpHandler } from './LnurlpHandler.js';
import { PayReqHandler } from './PayReqHandler.js';
import { UtxoCallbackHandler } from './UtxoCallbackHandler.js';

export function createUmaHandlers(config) {
  const pubKeyHandler = new PubKeyHandler(config);
  const lnurlpHandler = new LnurlpHandler(config);
  const payReqHandler = new PayReqHandler(config);
  const utxoCallbackHandler = new UtxoCallbackHandler(config);

  return {
    handlePubKeyRequest: pubKeyHandler.getHandler(),
    handleLnurlpRequest: lnurlpHandler.getHandler(),
    handlePayRequest: payReqHandler.getHandler(),
    handleUtxoCallback: utxoCallbackHandler.getHandler(),

    // Also expose handler instances for direct access
    handlers: {
      pubKey: pubKeyHandler,
      lnurlp: lnurlpHandler,
      payReq: payReqHandler,
      utxoCallback: utxoCallbackHandler,
    },
  };
}
