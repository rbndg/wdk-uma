/**
 * Admin Controller
 *
 * Handles admin API endpoints for domain and user management.
 */

export class AdminController {
  /**
   * @param {import('./TenantManager.js').TenantManager} tenantManager
   */
  constructor(tenantManager) {
    this.tenantManager = tenantManager;
  }

  /**
   * POST /api/admin/domains - Create domain
   */
  async createDomain(request, reply) {
    try {
      const tenant = await this.tenantManager.addTenant(request.body);
      return reply.status(201).send(tenant.toJSON());
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  }

  /**
   * GET /api/admin/domains - List domains
   */
  async listDomains(request, reply) {
    try {
      const tenants = await this.tenantManager.listTenants();
      return reply.send(tenants.map(t => t.toJSON()));
    } catch (error) {
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * GET /api/admin/domains/:domainId - Get domain details
   */
  async getDomain(request, reply) {
    try {
      const { domainId } = request.params;
      const tenant = await this.tenantManager.getTenant(domainId);
      if (!tenant) {
        return reply.status(404).send({ error: 'Domain not found' });
      }
      return reply.send(tenant.toJSON());
    } catch (error) {
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * DELETE /api/admin/domains/:domainId - Delete domain
   */
  async deleteDomain(request, reply) {
    try {
      const { domainId } = request.params;
      const deleted = await this.tenantManager.removeTenant(domainId);
      if (!deleted) {
        return reply.status(404).send({ error: 'Domain not found' });
      }
      return reply.status(204).send();
    } catch (error) {
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * GET /api/admin/users/:domainId - List domain users
   */
  async listUsers(request, reply) {
    try {
      const { domainId } = request.params;
      const tenant = await this.tenantManager.getTenant(domainId);
      if (!tenant) {
        return reply.status(404).send({ error: 'Domain not found' });
      }
      const users = await tenant.getUsers();
      return reply.send(users);
    } catch (error) {
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * POST /api/admin/users/:domainId - Create user
   */
  async createUser(request, reply) {
    try {
      const { domainId } = request.params;
      const tenant = await this.tenantManager.getTenant(domainId);
      if (!tenant) {
        return reply.status(404).send({ error: 'Domain not found' });
      }
      const result = await tenant.addUser(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  }

  /**
   * DELETE /api/admin/users/:domainId/:username - Delete user
   */
  async deleteUser(request, reply) {
    try {
      const { domainId, username } = request.params;
      const tenant = await this.tenantManager.getTenant(domainId);
      if (!tenant) {
        return reply.status(404).send({ error: 'Domain not found' });
      }
      const result = await tenant.db.collection(tenant.tables.users).deleteOne({ username });
      if (result.deletedCount === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }
      return reply.status(204).send();
    } catch (error) {
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * GET /health - Health check
   */
  async health(request, reply) {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  }

  /**
   * GET / - API information
   */
  async info(request, reply) {
    return reply.send({
      name: 'UMA Admin API',
      version: '1.0.0',
      endpoints: {
        domains: '/api/admin/domains',
        users: '/api/admin/users/:domainId',
        health: '/health',
      },
    });
  }
}
