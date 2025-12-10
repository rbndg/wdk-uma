/**
 * UMA Handlers Index
 *
 * Export all handler classes and lazy-loading executor.
 */

import { PubKeyHandler } from './PubKeyHandler.js';
import { LnurlpHandler } from './LnurlpHandler.js';
import { PayReqHandler } from './PayReqHandler.js';
import { UtxoCallbackHandler } from './UtxoCallbackHandler.js';

export { BaseHandler } from './BaseHandler.js';
export { PubKeyHandler } from './PubKeyHandler.js';
export { LnurlpHandler } from './LnurlpHandler.js';
export { PayReqHandler } from './PayReqHandler.js';
export { UtxoCallbackHandler } from './UtxoCallbackHandler.js';

/**
 * Handler name to class mapping
 */
const handlerMap = {
  handlerPubKeyRequest: PubKeyHandler,
  handlerLnurlpRequest: LnurlpHandler,
  handlerPayRequest: PayReqHandler,
  handlerUtxoCallback: UtxoCallbackHandler,
};

/**
 * Lazy-loading handler executor
 *
 * Creates handler instances on-demand and executes them.
 * Usage: executeHandler.handlerPubKeyRequest(umaConfig, request, reply)
 */
export const executeHandler = new Proxy({}, {
  get(target, prop) {
    const HandlerClass = handlerMap[prop];
    if (!HandlerClass) {
      throw new Error(`Unknown handler: ${prop}`);
    }
    return async (umaConfig, request, reply) => {
      const handler = new HandlerClass(umaConfig);
      return handler.handle(request, reply);
    };
  }
});
