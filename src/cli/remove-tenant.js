#!/usr/bin/env node

/**
 * CLI Script: Remove Tenant
 *
 * Usage:
 *   node src/cli/remove-tenant.js --id <id> [options]
 *
 * Options:
 *   --id        Tenant identifier (required)
 *   --force     Skip confirmation prompt
 *   --db-url    MongoDB connection URL (default: from env MONGODB_URL)
 *   --db-name   Database name (default: from env DB_NAME or 'uma')
 */

import { MongoClient } from 'mongodb';
import { createInterface } from 'readline';
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
      case '--id':
        parsed.id = next;
        i++;
        break;
      case '--force':
      case '-f':
        parsed.force = true;
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
Usage: node src/cli/remove-tenant.js --id <id> [options]

Required:
  --id          Tenant identifier

Optional:
  --force, -f   Skip confirmation prompt
  --db-url      MongoDB connection URL (default: env MONGODB_URL)
  --db-name     Database name (default: env DB_NAME or 'uma')
  --help, -h    Show this help message

Examples:
  # Remove tenant with confirmation
  node src/cli/remove-tenant.js --id vasp1

  # Remove tenant without confirmation
  node src/cli/remove-tenant.js --id vasp1 --force
`);
}

/**
 * Prompt for confirmation
 */
function confirm(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
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
    const tenant = await tenantManager.getTenant(args.id);
    if (!tenant) {
      console.error(`Error: Tenant "${args.id}" not found`);
      process.exit(1);
    }

    console.log(`\nTenant to remove:`);
    console.log(`  ID:     ${tenant.id}`);
    console.log(`  Name:   ${tenant.name}`);
    console.log(`  Domain: ${tenant.domain}`);

    // Confirm removal
    if (!args.force) {
      const confirmed = await confirm('\nAre you sure you want to remove this tenant? (y/N): ');
      if (!confirmed) {
        console.log('Aborted.');
        process.exit(0);
      }
    }

    // Remove tenant
    const removed = await tenantManager.removeTenant(args.id);
    if (removed) {
      console.log(`\nTenant "${args.id}" removed successfully.`);
    } else {
      console.error(`\nFailed to remove tenant "${args.id}".`);
      process.exit(1);
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
