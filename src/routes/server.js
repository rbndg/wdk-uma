  import Fastify from 'fastify';
  import { registerUmaRoutes } from './index.js';
  import { createUmaHandlers } from '../uma/index.js';
  import { TenantManager } from '../domains/index.js'


  import { MongoClient } from 'mongodb'

  async function startDb() {
    const url = 'mongodb://localhost:27017';
    const client = new MongoClient(url);
    await client.connect();

    return client

  }


  async function  main() {
    const fastify = Fastify({ logger: true });

    const dbClient = await startDb()

    const tenants = new TenantManager({
      dbClient
    })

    await tenants.initialize()

    const activeTenants = tenants.getActiveTenants()

    await Promise.all(activeTenants.map( async (tenant) => {
      const umaConfig = tenant.getUmaConfig()
      const { handlePubKeyRequest, handleLnurlpRequest, handlePayRequest, handleUtxoCallback } = createUmaHandlers(umaConfig);
      await registerUmaRoutes(fastify, {
        handlePubKeyRequest,
        handleLnurlpRequest,
        handlePayRequest,
        handleUtxoCallback,
      });

    }))

  }


  main()
