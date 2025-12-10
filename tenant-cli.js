#!/usr/bin/env node

/**
 * UMA CLI
 *
 * Usage:
 *   node src/cli/index.js <command> [options]
 *
 * Commands:
 *   add-tenant      Add a new tenant
 *   remove-tenant   Remove a tenant
 *   list-tenants    List all tenants
 *   update-tenant   Update a tenant
 *   help            Show help
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = {
  'add-tenant': 'add-tenant.js',
  'remove-tenant': 'remove-tenant.js',
  'list-tenants': 'list-tenants.js',
  'update-tenant': 'update-tenant.js',
};

function printUsage() {
  console.log(`
UMA CLI - Multi-tenant UMA Management

Usage: node src/cli/index.js <command> [options]

Commands:
  add-tenant      Add a new tenant
  remove-tenant   Remove a tenant
  list-tenants    List all tenants
  update-tenant   Update a tenant
  help            Show this help message

Examples:
  node src/cli/index.js add-tenant --id vasp1 --name "My VASP" --domain vasp1.com
  node src/cli/index.js list-tenants
  node src/cli/index.js remove-tenant --id vasp1

Run 'node src/cli/index.js <command> --help' for more information on a command.
`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  const scriptFile = commands[command];
  if (!scriptFile) {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }

  const scriptPath = join(__dirname, scriptFile);
  const childArgs = args.slice(1);

  const child = spawn('node', [scriptPath, ...childArgs], {
    stdio: 'inherit',
  });

  child.on('close', (code) => {
    process.exit(code);
  });
}

main();
