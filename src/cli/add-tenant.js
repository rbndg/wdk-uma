#!/usr/bin/env node

/**
 * CLI Script: Add Tenant
 *
 * Usage:
 *   node src/cli/add-tenant.js --id <id> --name <name> --domain <domain> [options]
 *
 * Options:
 *   --id          Unique tenant identifier (required)
 *   --name        Tenant display name (required)
 *   --domain      VASP domain (required)
 *   --base-url    Base URL for callbacks (default: https://{domain})
 *   --min-sats    Minimum sendable sats (default: 1)
 *   --max-sats    Maximum sendable sats (default: 10000000)
 *   --generate-keys  Generate new key pairs (default: true)
 *   --signing-key    Hex-encoded signing private key (optional)
 *   --encryption-key Hex-encoded encryption private key (optional)
 *   --db-url      MongoDB connection URL (default: from env MONGODB_URL)
 *   --db-name     Database name (default: from env DB_NAME or 'uma')
 */

import { MongoClient } from 'mongodb';
import { randomBytes } from 'crypto';
import { secp256k1 } from '@noble/curves/secp256k1';
import { TenantManager } from '../domains/TenantManager.js';

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const parsed = {
    generateKeys: true,
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
        parsed.name = next;
        i++;
        break;
      case '--domain':
        parsed.domain = next;
        i++;
        break;
      case '--base-url':
        parsed.baseUrl = next;
        i++;
        break;
      case '--min-sats':
        parsed.minSendableSats = parseInt(next, 10);
        i++;
        break;
      case '--max-sats':
        parsed.maxSendableSats = parseInt(next, 10);
        i++;
        break;
      case '--generate-keys':
        parsed.generateKeys = next !== 'false';
        i++;
        break;
      case '--signing-key':
        parsed.signingKey = next;
        i++;
        break;
      case '--encryption-key':
        parsed.encryptionKey = next;
        i++;
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
Usage: node src/cli/add-tenant.js --id <id> --name <name> --domain <domain> [options]

Required:
  --id            Unique tenant identifier
  --name          Tenant display name
  --domain        VASP domain (e.g., vasp.example.com)

Optional:
  --base-url      Base URL for callbacks (default: https://{domain})
  --min-sats      Minimum sendable sats (default: 1)
  --max-sats      Maximum sendable sats (default: 10000000)
  --generate-keys Generate new key pairs (default: true)
  --signing-key   Hex-encoded signing private key
  --encryption-key Hex-encoded encryption private key
  --db-url        MongoDB connection URL (default: env MONGODB_URL)
  --db-name       Database name (default: env DB_NAME or 'uma')
  --help, -h      Show this help message

Examples:
  # Add tenant with auto-generated keys
  node src/cli/add-tenant.js --id vasp1 --name "My VASP" --domain vasp1.example.com

  # Add tenant with custom keys
  node src/cli/add-tenant.js --id vasp1 --name "My VASP" --domain vasp1.example.com \\
    --signing-key <hex> --encryption-key <hex> --generate-keys false
`);
}

/**
 * Generate a new key pair
 */
function generateKeyPair() {
  const privateKey = randomBytes(32);
  const publicKey = secp256k1.getPublicKey(privateKey, true);
  return {
    privateKey: new Uint8Array(privateKey),
    publicKey: Buffer.from(publicKey).toString('hex'),
  };
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

  // Validate required arguments
  if (!args.id) {
    console.error('Error: --id is required');
    printUsage();
    process.exit(1);
  }

  if (!args.name) {
    console.error('Error: --name is required');
    printUsage();
    process.exit(1);
  }

  if (!args.domain) {
    console.error('Error: --domain is required');
    printUsage();
    process.exit(1);
  }

  // Get database connection
  const dbUrl = args.dbUrl || process.env.MONGODB_URL || 'mongodb://localhost:27017';
  const dbName = args.dbName || process.env.DB_NAME || 'uma';

  console.log(`Connecting to database: ${dbUrl}`);

  let client;
  try {
    client = await MongoClient.connect(dbUrl);

    // Initialize tenant manager
    const tenantManager = new TenantManager({ dbClient : client });
    await tenantManager.initialize();

    // Generate or use provided keys
    let keys;
    if (args.generateKeys && !args.signingKey && !args.encryptionKey) {
      console.log('Generating new key pairs...');
      const signingKeyPair = generateKeyPair();
      const encryptionKeyPair = generateKeyPair();

      keys = {
        signingPrivateKey: signingKeyPair.privateKey,
        signingPublicKey: signingKeyPair.publicKey,
        encryptionPrivateKey: encryptionKeyPair.privateKey,
        encryptionPublicKey: encryptionKeyPair.publicKey,
      };

      console.log('\nGenerated Keys (save these securely!):');
      console.log(`  Signing Private Key:    ${Buffer.from(signingKeyPair.privateKey).toString('hex')}`);
      console.log(`  Signing Public Key:     ${signingKeyPair.publicKey}`);
      console.log(`  Encryption Private Key: ${Buffer.from(encryptionKeyPair.privateKey).toString('hex')}`);
      console.log(`  Encryption Public Key:  ${encryptionKeyPair.publicKey}`);
    } else {
      if (!args.signingKey || !args.encryptionKey) {
        console.error('Error: Both --signing-key and --encryption-key are required when not generating keys');
        process.exit(1);
      }

      const signingPrivateKey = new Uint8Array(Buffer.from(args.signingKey, 'hex'));
      const encryptionPrivateKey = new Uint8Array(Buffer.from(args.encryptionKey, 'hex'));

      keys = {
        signingPrivateKey,
        signingPublicKey: Buffer.from(secp256k1.getPublicKey(signingPrivateKey, true)).toString('hex'),
        encryptionPrivateKey,
        encryptionPublicKey: Buffer.from(secp256k1.getPublicKey(encryptionPrivateKey, true)).toString('hex'),
      };
    }

    // Create tenant config
    const tenantConfig = {
      id: args.id,
      name: args.name,
      domain: args.domain,
      keys,
      baseUrl: args.baseUrl,
      minSendableSats: args.minSendableSats,
      maxSendableSats: args.maxSendableSats,
      active: true,
    };

    // Add tenant
    console.log(`\nAdding tenant: ${args.id}`);
    const tenant = await tenantManager.addTenant(tenantConfig);

    console.log('\nTenant created successfully!');
    console.log(`  ID:     ${tenant.id}`);
    console.log(`  Name:   ${tenant.name}`);
    console.log(`  Domain: ${tenant.domain}`);
    console.log(`  Active: ${tenant.active}`);
    console.log(`  Tables:`);
    console.log(`    Users:    ${tenant.tables.users}`);
    console.log(`    Payments: ${tenant.tables.payments}`);
    console.log(`    UTXOs:    ${tenant.tables.utxos}`);

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
