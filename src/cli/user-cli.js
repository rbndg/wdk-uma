#!/usr/bin/env node

/**
 * CLI for UMA Admin operations
 *
 * Usage:
 *   node cli.js add-user <tenantId> <username> [--email <email>] [--name <name>]
 *   node cli.js list-users <tenantId>
 *   node cli.js list-domains
 */

import { MongoClient } from 'mongodb'
import { TenantManager } from '../domains/TenantManager.js'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017'

async function getDb () {
  const client = new MongoClient(MONGO_URL)
  await client.connect()
  return client
}

async function getTenantManager () {
  const dbClient = await getDb()
  const tenants = new TenantManager({ dbClient })
  await tenants.initialize()
  return tenants
}

function parseArgs (args) {
  const result = { flags: {}, positional: [] }
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      result.flags[key] = args[i + 1]
      i++
    } else {
      result.positional.push(args[i])
    }
  }
  return result
}

async function addUser (tenantId, username, flags) {
  const tenants = await getTenantManager()
  const tenant = await tenants.getTenant(tenantId)

  if (!tenant) {
    console.error(`Tenant "${tenantId}" not found`)
    process.exit(1)
  }

  const userObj = {
    username,
    email: flags.email,
    name: flags.name
  }

  // Remove undefined values
  Object.keys(userObj).forEach(key => {
    if (userObj[key] === undefined) delete userObj[key]
  })

  try {
    const user = await tenant.addUser(userObj)
    console.log('User created:', user)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }

  process.exit(0)
}

async function listUsers (tenantId) {
  const tenants = await getTenantManager()
  const tenant = await tenants.getTenant(tenantId)

  if (!tenant) {
    console.error(`Tenant "${tenantId}" not found`)
    process.exit(1)
  }

  const users = await tenant.getUsers()
  console.log('Users:')
  users.forEach(user => {
    console.log(`  - ${user.username} (${user.email || 'no email'})`)
  })

  process.exit(0)
}

async function listDomains () {
  const tenants = await getTenantManager()
  const domains = await tenants.listTenants()

  console.log('Domains:')
  domains.forEach(domain => {
    console.log(`  - ${domain.id}: ${domain.domain} (${domain.active ? 'active' : 'inactive'})`)
  })

  process.exit(0)
}

function showHelp () {
  console.log(`
UMA CLI

Usage:
  npm run cli:user <command> [options]

Commands:
  add-user <tenantId> <username>    Add a user to a tenant
    --email <email>                 User email (optional)
    --name <name>                   User name (optional)

  list-users <tenantId>             List users for a tenant

  list-domains                      List all domains/tenants

Examples:
  npm run cli:user -- add-user tenant1 alice --email alice@example.com
  npm run cli:user --  cli.js list-users tenant1
  npm run cli:user --  cli.js list-domains
`)
}

async function main () {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp()
    process.exit(0)
  }

  const command = args[0]
  const { positional, flags } = parseArgs(args.slice(1))

  switch (command) {
    case 'add-user':
      if (positional.length < 2) {
        console.error('Usage: add-user <tenantId> <username>')
        process.exit(1)
      }
      await addUser(positional[0], positional[1], flags)
      break

    case 'list-users':
      if (positional.length < 1) {
        console.error('Usage: list-users <tenantId>')
        process.exit(1)
      }
      await listUsers(positional[0])
      break

    case 'list-domains':
      await listDomains()
      break

    default:
      console.error(`Unknown command: ${command}`)
      showHelp()
      process.exit(1)
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
