  import Fastify from 'fastify';
  import { registerUmaRoutes } from './index.js';
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

    fastify.addHook("onRequest", (req, reply, done) => {
      const host = req.hostname;      // full host
      const sub = host.split(".")[0]; // extract subdomainoi

      if(sub.length !== 2) return done()

      const tenant = activeTenants.find((t) => {
        return t.hostname === sub
      })
      if(!tenant) {
        return reply.status(404).send({
          status : 'ERROR',
          reason : 'Not valid tenant'
        })
      }
      req.tenant = tenant;
      done();
    });

    await registerUmaRoutes(fastify, { tenants });

    fastify.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      console.log(`Service:  is listening on ${address}`)
    })

  }


  main()
