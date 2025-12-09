Here is a super nice and clear Markdown representation of your CLI documentation.

-----

# 💻 UMA CLI Commands

This document outlines the command-line interface (CLI) commands for managing tenants and configuration.

## 🚀 Main CLI Entry Point

Most commands can be executed via the main entry file:

```bash
node src/cli/index.js <command> [options]
```

-----

## ➕ Add Tenant

Creates a new UMA tenant (VASP) configuration.

### Basic Registration

```bash
node src/cli/add-tenant.js --id vasp1 --name "My VASP" --domain vasp1.com
```

### With Custom Keys and Limits

You can provide custom public/private keys or set transaction limits.

| Option | Description |
| :--- | :--- |
| `--signing-key` | Tenant's signing private key (hex format). |
| `--encryption-key` | Tenant's encryption private key (hex format). |
| `--generate-keys` | Set to `false` to prevent automatic key generation. |
| `--min-sats` | Minimum amount in satoshis the VASP can handle. |
| `--max-sats` | Maximum amount in satoshis the VASP can handle. |

```bash
# With custom keys (requires --generate-keys false)
node src/cli/add-tenant.js --id vasp1 --name "My VASP" --domain vasp1.com \
  --signing-key <hex> \
  --encryption-key <hex> \
  --generate-keys false

# With transaction limits
node src/cli/add-tenant.js --id vasp1 --name "My VASP" --domain vasp1.com \
  --min-sats 100 \
  --max-sats 1000000
```

-----

## 📝 Update Tenant

Modifies an existing tenant's configuration.

| Option | Description |
| :--- | :--- |
| `--id` | **Required.** The ID of the VASP/tenant to update. |
| `--name` | New display name for the tenant. |
| `--domain` | New domain for the VASP. |
| `--deactivate` | Deactivates the tenant. |
| `--activate` | Activates the tenant. |
| `--min-sats` | Update minimum transaction limit. |

```bash
# Update name and domain
node src/cli/update-tenant.js --id vasp1 --name "New Name"
node src/cli/update-tenant.js --id vasp1 --domain newdomain.com --min-sats 50

# Change tenant status
node src/cli/update-tenant.js --id vasp1 --deactivate
node src/cli/update-tenant.js --id vasp1 --activate
```

-----

## 🗑️ Remove Tenant

Deletes a tenant configuration from the database.

```bash
node src/cli/remove-tenant.js --id vasp1
```

-----

## 📜 List Tenants

Displays a list of all configured tenants.

| Option | Description |
| :--- | :--- |
| `--active` | List only active tenants. |
| `--inactive` | List only inactive tenants. |
| `--json` | Output the list in JSON format. |

```bash
# List all tenants
node src/cli/list-tenants.js

# List only active tenants
node src/cli/list-tenants.js --active

# List tenants in JSON format
node src/cli/list-tenants.js --json
```

-----

## ⚙️ Environment Variables

The CLI commands rely on the following environment variables for database connectivity:

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `MONGODB_URL` | MongoDB connection URL | `mongodb://localhost:27017` |
| `DB_NAME` | Database name to use | `uma` |

-----

Would you like to generate an example script that uses one of these commands, such as adding a new tenant?
