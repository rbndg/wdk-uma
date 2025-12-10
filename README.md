# WDK UMA

Multi-tenant UMA (Universal Money Address) microservice for Lightning payments.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Fastify Server                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   UMA Routes    │  │  Admin Routes   │                  │
│  │  /.well-known/* │  │  /api/admin/*   │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
│           ▼                    ▼                            │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ executeHandler  │  │AdminController  │                  │
│  │  (lazy loader)  │  │                 │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
│           ▼                    ▼                            │
│  ┌─────────────────────────────────────────┐               │
│  │             TenantManager               │               │
│  │  - Tenant cache (in-memory)             │               │
│  │  - Key management                       │               │
│  └────────────────────┬────────────────────┘               │
│                       │                                     │
│           ┌───────────┴───────────┐                        │
│           ▼                       ▼                        │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │     Tenant      │    │     Tenant      │               │
│  │  - Users        │    │  - Users        │               │
│  │  - Payments     │    │  - Payments     │               │
│  │  - UTXOs        │    │  - UTXOs        │               │
│  └─────────────────┘    └─────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    MongoDB      │
                    └─────────────────┘
```

### Components

- **TenantManager**: Manages multi-tenant domains, handles tenant CRUD operations and caching
- **Tenant**: Represents a single tenant/domain with its own users, payments, and UTXO tables
- **executeHandler**: Lazy-loading proxy that instantiates UMA handlers on-demand per request
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

### UMA Protocol Endpoints

These endpoints implement the UMA protocol for Lightning payments.

#### GET /.well-known/lnurlpubkey

Returns public keys for signature verification and encryption.

**Response:**
```json
{
  "signingPubKey": "hex-encoded-public-key",
  "encryptionPubKey": "hex-encoded-public-key",
  "expirationTimestamp": 1234567890
}
```

#### GET /.well-known/lnurlp/:username

Returns LNURL-pay metadata for a user.

**Parameters:**
- `username` - UMA username

**Response:**
```json
{
  "callback": "https://domain.com/api/uma/payreq/username",
  "minSendable": 1000,
  "maxSendable": 10000000000,
  "metadata": "[[\"text/plain\", \"Payment to username\"]]",
  "tag": "payRequest"
}
```

#### POST /api/uma/payreq/:callbackId

Processes a payment request and returns a Lightning invoice.

**Parameters:**
- `callbackId` - Callback identifier (usually username)

**Request Body:**
```json
{
  "amount": 1000,
  "payerData": {
    "identifier": "sender@domain.com"
  }
}
```

**Response:**
```json
{
  "pr": "lnbc...",
  "routes": []
}
```

#### POST /api/uma/utxocallback

Receives UTXO information after payment completion.

**Request Body:**
```json
{
  "utxos": ["txid:vout"],
  "paymentHash": "hex-string"
}
```

---

### Admin Endpoints

#### Service

##### GET /

Returns API information.

**Response:**
```json
{
  "name": "UMA Admin API",
  "version": "1.0.0",
  "endpoints": {
    "domains": "/api/admin/domains",
    "users": "/api/admin/users/:domainId",
    "health": "/health"
  }
}
```

##### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Domain Management

##### POST /api/admin/domains

Create a new domain/tenant.

**Request Body:**
```json
{
  "id": "tenant1",
  "name": "My VASP",
  "domain": "vasp.example.com",
  "keys": {
    "signingPrivateKey": [/* Uint8Array */],
    "signingPublicKey": "hex-string",
    "encryptionPrivateKey": [/* Uint8Array */],
    "encryptionPublicKey": "hex-string"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "tenant1",
  "name": "My VASP",
  "domain": "vasp.example.com",
  "active": true
}
```

##### GET /api/admin/domains

List all domains.

**Response:**
```json
[
  {
    "id": "tenant1",
    "name": "My VASP",
    "domain": "vasp.example.com",
    "active": true
  }
]
```

##### GET /api/admin/domains/:domainId

Get domain details.

**Parameters:**
- `domainId` - Domain/tenant ID

**Response:**
```json
{
  "id": "tenant1",
  "name": "My VASP",
  "domain": "vasp.example.com",
  "active": true,
  "currencies": [],
  "minSendableSats": 1,
  "maxSendableSats": 10000000
}
```

##### DELETE /api/admin/domains/:domainId

Delete a domain.

**Parameters:**
- `domainId` - Domain/tenant ID

**Response:** `204 No Content`

#### User Management

##### GET /api/admin/users/:domainId

List users for a domain.

**Parameters:**
- `domainId` - Domain/tenant ID

**Response:**
```json
[
  {
    "username": "alice",
    "email": "alice@example.com",
    "tenantId": "tenant1",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

##### POST /api/admin/users/:domainId

Create a user in a domain.

**Parameters:**
- `domainId` - Domain/tenant ID

**Request Body:**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "name": "Alice Smith"
}
```

**Response:** `201 Created`
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "tenantId": "tenant1",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

##### DELETE /api/admin/users/:domainId/:username

Delete a user.

**Parameters:**
- `domainId` - Domain/tenant ID
- `username` - Username to delete

**Response:** `204 No Content`

---

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
