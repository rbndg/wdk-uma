/**
 * Base Handler Class
 *
 * Abstract base class for all UMA route handlers.
 */

/**
 * @typedef {import('../UmaConfig.js').UmaConfig} UmaConfig
 */

export class BaseHandler {
  /**
   * @param {UmaConfig} config - UMA configuration instance
   */
  constructor(config) {
    if (new.target === BaseHandler) {
      throw new Error('BaseHandler is abstract and cannot be instantiated directly');
    }
    this.config = config;
  }

  /**
   * Get the bound handler function for use with Fastify
   * @returns {Function} Bound handler function
   */
  getHandler() {
    return this.handle.bind(this);
  }

  /**
   * Handle the request - must be implemented by subclasses
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   * @returns {Promise<any>}
   */
  async handle(request, reply) {
    throw new Error('handle() must be implemented by subclass');
  }

  /**
   * Send an error response
   * @param {Object} reply - Fastify reply object
   * @param {number} statusCode - HTTP status code
   * @param {string} reason - Error reason
   * @returns {Object}
   */
  sendError(reply, statusCode, reason) {
    return reply.status(statusCode).send({
      status: 'ERROR',
      reason,
    });
  }

  /**
   * Log an error
   * @param {Object} request - Fastify request object
   * @param {Error} error - Error object
   * @param {string} message - Log message
   */
  logError(request, error, message) {
    request.log.error(error, message);
  }

  /**
   * Log a warning
   * @param {Object} request - Fastify request object
   * @param {string} message - Log message
   */
  logWarn(request, message) {
    request.log.warn(message);
  }
}
