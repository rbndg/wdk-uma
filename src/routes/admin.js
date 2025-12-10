/**
 * Admin Routes
 *
 * Registers admin API routes for domain and user management.
 */

import { AdminController } from '../domains/AdminController.js';

/**
 * Register admin routes
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {import('../domains/TenantManager.js').TenantManager} tenants
 */
export async function registerAdminRoutes(fastify, { tenants }) {
  const controller = new AdminController(tenants);

  // Service endpoints
  fastify.get('/', controller.info.bind(controller));
  fastify.get('/health', controller.health.bind(controller));

  // Domain management
  fastify.post('/api/admin/domains', controller.createDomain.bind(controller));
  fastify.get('/api/admin/domains', controller.listDomains.bind(controller));
  fastify.get('/api/admin/domains/:domainId', controller.getDomain.bind(controller));
  fastify.delete('/api/admin/domains/:domainId', controller.deleteDomain.bind(controller));

  // User management
  fastify.get('/api/admin/users/:domainId', controller.listUsers.bind(controller));
  fastify.post('/api/admin/users/:domainId', controller.createUser.bind(controller));
  fastify.delete('/api/admin/users/:domainId/:username', controller.deleteUser.bind(controller));
}
