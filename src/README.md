  CLI Commands

  Main CLI Entry

  node src/cli/index.js <command> [options]

  Add Tenant

  node src/cli/add-tenant.js --id vasp1 --name "My VASP" --domain vasp1.com

  # With custom keys
  node src/cli/add-tenant.js --id vasp1 --name "My VASP" --domain vasp1.com \
    --signing-key <hex> --encryption-key <hex> --generate-keys false

  # With limits
  node src/cli/add-tenant.js --id vasp1 --name "My VASP" --domain vasp1.com \
    --min-sats 100 --max-sats 1000000

  Remove Tenant

  node src/cli/remove-tenant.js --id vasp1

  # Skip confirmation
  node src/cli/remove-tenant.js --id vasp1 --force

  List Tenants

  node src/cli/list-tenants.js
  node src/cli/list-tenants.js --active
  node src/cli/list-tenants.js --inactive
  node src/cli/list-tenants.js --json

  Update Tenant

  node src/cli/update-tenant.js --id vasp1 --name "New Name"
  node src/cli/update-tenant.js --id vasp1 --deactivate
  node src/cli/update-tenant.js --id vasp1 --activate
  node src/cli/update-tenant.js --id vasp1 --domain newdomain.com --min-sats 50

  Environment Variables

  - MONGODB_URL - MongoDB connection URL (default: mongodb://localhost:27017)
  - DB_NAME - Database name (default: uma)

