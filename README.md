# WDK UMA

Multi-tenant UMA (Universal Money Address) microservice for Lightning payments.

## Architecture

### Components

- **TenantManager**: Manages multi-tenant domains, handles tenant CRUD operations 
- **Tenant**: Represents a single tenant/domain with its own users, payments, and UTXO tables
- **executeHandler**: Instantiates UMA handlers on-demand per request
- **AdminController**: Handles admin API endpoints for domain and user management

### Request Flow

1. Request arrives at Fastify
2. `onRequest` hook extracts tenant from hostname
3. Route handler gets tenant's UMA config via `request.tenant.getUmaConfig()`
4. Handler is lazily instantiated and processes the request

## Setup

```bash
# Install dependencies
npm install

# Start MongoDB
mongod

# Run development server
npm run dev

# Run production server
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB connection string |

## API Endpoints

### UMA Protocol

```
GET  /.well-known/lnurlpubkey
GET  /.well-known/lnurlp/:username
POST /api/uma/payreq/:callbackId
POST /api/uma/utxocallback
```

### Admin

```
GET  /
GET  /health

POST   /api/admin/domains
GET    /api/admin/domains
GET    /api/admin/domains/:domainId
DELETE /api/admin/domains/:domainId

GET    /api/admin/users/:domainId
POST   /api/admin/users/:domainId
DELETE /api/admin/users/:domainId/:username
```

## CLI

```bash
# Add a user to a tenant
npm run cli add-user <tenantId> <username> [--email <email>] [--name <name>]

# List users for a tenant
npm run cli list-users <tenantId>

# List all domains
npm run cli list-domains
```

**Examples:**
```bash
npm run cli add-user tenant1 alice --email alice@example.com --name "Alice Smith"
npm run cli list-users tenant1
npm run cli list-domains
```

## Project Structure

```
src/
├── domains/
│   ├── Tenant.js           # Tenant model
│   ├── TenantManager.js    # Tenant CRUD and caching
│   ├── TenantUser.js       # User model
│   ├── TenantUmaConfig.js  # UMA config adapter
│   ├── AdminController.js  # Admin API controller
│   └── index.js
├── uma/
│   └── handlers/
│       ├── BaseHandler.js       # Abstract handler base
│       ├── PubKeyHandler.js     # Public key endpoint
│       ├── LnurlpHandler.js     # LNURL-pay endpoint
│       ├── PayReqHandler.js     # Payment request endpoint
│       ├── UtxoCallbackHandler.js # UTXO callback endpoint
│       └── index.js             # Handler exports & lazy loader
├── routes/
│   ├── index.js      # Route registration
│   ├── admin.js      # Admin routes
│   └── server.js     # Server entry point
cli.js                # CLI tool
```

## License

MIT
