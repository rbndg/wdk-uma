#!/usr/bin/env node

/**
 * CLI Script: Update Tenant
 *
 * Usage:
 *   node src/cli/update-tenant.js --id <id> [options]
 *
 * Options:
 *   --id            Tenant identifier (required)
 *   --name          Update tenant name
 *   --domain        Update domain
 *   --base-url      Update base URL
 *   --min-sats      Update minimum sendable sats
 *   --max-sats      Update maximum sendable sats
 *   --activate      Activate the tenant
 *   --deactivate    Deactivate the tenant
 *   --db-url        MongoDB connection URL (default: from env MONGODB_URL)
 *   --db-name       Database name (default: from env DB_NAME or 'uma')
 */

import { MongoClient } from 'mongodb';
import { TenantManager } from '../domains/TenantManager.js';

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const parsed = {
    updates: {},
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--id':
        parsed.id = next;
        i++;
        break;
      case '--name':
        parsed.updates.name = next;
        i++;
        break;
      case '--domain':
        parsed.updates.domain = next;
        i++;
        break;
      case '--base-url':
        parsed.updates.baseUrl = next;
        i++;
        break;
      case '--min-sats':
        parsed.updates.minSendableSats = parseInt(next, 10);
        i++;
        break;
      case '--max-sats':
        parsed.updates.maxSendableSats = parseInt(next, 10);
        i++;
        break;
      case '--activate':
        parsed.updates.active = true;
        break;
      case '--deactivate':
        parsed.updates.active = false;
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
Usage: node src/cli/update-tenant.js --id <id> [options]

Required:
  --id            Tenant identifier

Optional:
  --name          Update tenant name
  --domain        Update domain
  --base-url      Update base URL
  --min-sats      Update minimum sendable sats
  --max-sats      Update maximum sendable sats
  --activate      Activate the tenant
  --deactivate    Deactivate the tenant
  --db-url        MongoDB connection URL (default: env MONGODB_URL)
  --db-name       Database name (default: env DB_NAME or 'uma')
  --help, -h      Show this help message

Examples:
  # Update tenant name
  node src/cli/update-tenant.js --id vasp1 --name "New VASP Name"

  # Deactivate a tenant
  node src/cli/update-tenant.js --id vasp1 --deactivate

  # Update multiple fields
  node src/cli/update-tenant.js --id vasp1 --name "New Name" --domain newdomain.com
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

  if (!args.id) {
    console.error('Error: --id is required');
    printUsage();
    process.exit(1);
  }

  if (Object.keys(args.updates).length === 0) {
    console.error('Error: No updates specified');
    printUsage();
    process.exit(1);
  }

  const dbUrl = args.dbUrl || process.env.MONGODB_URL || 'mongodb://localhost:27017';
  const dbName = args.dbName || process.env.DB_NAME || 'uma';

  console.log(`Connecting to database: ${dbUrl}`);

  let client;
  try {
    client = await MongoClient.connect(dbUrl);
    const db = client.db(dbName);

    const tenantManager = new TenantManager({ db });
    await tenantManager.initialize();

    // Check if tenant exists
    const existingTenant = await tenantManager.getTenant(args.id);
    if (!existingTenant) {
      console.error(`Error: Tenant "${args.id}" not found`);
      process.exit(1);
    }

    console.log(`\nUpdating tenant: ${args.id}`);
    console.log('Changes:');
    for (const [key, value] of Object.entries(args.updates)) {
      console.log(`  ${key}: ${existingTenant[key]} -> ${value}`);
    }

    // Update tenant
    const tenant = await tenantManager.updateTenant(args.id, args.updates);

    console.log('\nTenant updated successfully!');
    console.log(`  ID:     ${tenant.id}`);
    console.log(`  Name:   ${tenant.name}`);
    console.log(`  Domain: ${tenant.domain}`);
    console.log(`  Active: ${tenant.active}`);

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
