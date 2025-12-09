#!/usr/bin/env node

/**
 * CLI Script: List Tenants
 *
 * Usage:
 *   node src/cli/list-tenants.js [options]
 *
 * Options:
 *   --active    Show only active tenants
 *   --inactive  Show only inactive tenants
 *   --json      Output as JSON
 *   --db-url    MongoDB connection URL (default: from env MONGODB_URL)
 *   --db-name   Database name (default: from env DB_NAME or 'uma')
 */

import { MongoClient } from 'mongodb';
import { TenantManager } from '../domains/TenantManager.js';

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--active':
        parsed.active = true;
        break;
      case '--inactive':
        parsed.inactive = true;
        break;
      case '--json':
        parsed.json = true;
        break;
      case '--db-url':
        parsed.dbUrl = next;
        i++;
        break;
      case '--db-name':
        parsed.dbName = next;
        i++;
        break;
      case '--help':
      case '-h':
        parsed.help = true;
        break;
    }
  }

  return parsed;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Usage: node src/cli/list-tenants.js [options]

Optional:
  --active      Show only active tenants
  --inactive    Show only inactive tenants
  --json        Output as JSON
  --db-url      MongoDB connection URL (default: env MONGODB_URL)
  --db-name     Database name (default: env DB_NAME or 'uma')
  --help, -h    Show this help message

Examples:
  # List all tenants
  node src/cli/list-tenants.js

  # List only active tenants
  node src/cli/list-tenants.js --active

  # Output as JSON
  node src/cli/list-tenants.js --json
`);
}

/**
 * Main function
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const dbUrl = args.dbUrl || process.env.MONGODB_URL || 'mongodb://localhost:27017';
  const dbName = args.dbName || process.env.DB_NAME || 'uma';

  let client;
  try {
    client = await MongoClient.connect(dbUrl);
    const db = client.db(dbName);

    const tenantManager = new TenantManager({ db });
    await tenantManager.initialize();

    // Build filter
    const filter = {};
    if (args.active) {
      filter.active = true;
    } else if (args.inactive) {
      filter.active = false;
    }

    // List tenants
    const tenants = await tenantManager.listTenants(filter);

    if (args.json) {
      console.log(JSON.stringify(tenants.map(t => t.toJSON()), null, 2));
    } else {
      if (tenants.length === 0) {
        console.log('No tenants found.');
      } else {
        console.log(`\nFound ${tenants.length} tenant(s):\n`);
        console.log('ID'.padEnd(20) + 'Name'.padEnd(25) + 'Domain'.padEnd(30) + 'Active');
        console.log('-'.repeat(80));

        for (const tenant of tenants) {
          const active = tenant.active ? 'Yes' : 'No';
          console.log(
            tenant.id.padEnd(20) +
            tenant.name.substring(0, 23).padEnd(25) +
            tenant.domain.substring(0, 28).padEnd(30) +
            active
          );
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

main();
