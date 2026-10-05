# Attribution Service

Standalone dedupe and attribution service. Checks whether an incoming lead is a duplicate before allowing onboarding, and tracks which UTM source should be credited for a customer acquisition.

---

## Overview

The service exposes a single HTTP API used by DSA (Direct Selling Agent) partners. Each request is authenticated via JWE (JSON Web Encryption) + Basic Auth, rate-limited, and its outcome is logged to a MySQL audit table.

**Core logic (in order):**

1. Look up the customer by mobile / PAN (or their SHA-256 hashes).
2. If found, check whether an active lead, disbursed loan, or non-expired attribution exists.
3. Return `Dedup Success` or `Dedup Fail` accordingly.
4. Log the API call result to `dsa_api_logs`.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js (TypeScript, CommonJS) |
| Framework | Express 4 |
| Database | MySQL (via Knex query builder + mysql2 driver) |
| Auth | JWE (ECDH-ES + A256GCM) + Basic Auth |
| Validation | Joi |
| Logging | Pino |
| Migrations | Knex CLI |

---

## Project Structure

```
src/
├── config/          # Environment config
├── constants/       # DSA API type constants
├── controllers/     # Route handlers
├── database/
│   └── mysql/       # Knex model classes
├── enum/            # Lead status enums
├── interfaces/      # TypeScript interfaces
├── middlewares/     # Auth, validation, DSA log middleware
├── routes/          # Express router definitions
├── services/        # Business logic (attribution, dedupe)
├── utils/           # Logger, MySQL connection
└── validations/     # Joi schemas
migrations/          # Knex migration files
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `3001`) |
| `NODE_ENV` | `development` \| `production` |
| `MYSQL_HOST` | MySQL host |
| `MYSQL_PORT` | MySQL port (default `3306`) |
| `MYSQL_USER` | MySQL username |
| `MYSQL_PASSWORD` | MySQL password |
| `MYSQL_DATABASE` | MySQL database name |
| `DEFAULT_UTM_SOURCE` | Fallback UTM source when none is resolved (default `app_v1`) |
| `SERVER_EC_PRIVATE_PEM_PATH` | EC private key for JWE decryption — inline PEM (with `\n`) or a file path |

---

## Getting Started

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build for production

```bash
npm run build
npm start
```

---

## Database Migrations

Migrations use the Knex CLI. `ts-node` is auto-detected from devDependencies.

```bash
# Apply all pending migrations
npm run migrate:latest

# Roll back the last batch
npm run migrate:rollback

# Show migration status
npm run migrate:status
```

### Tables

| Table | Owner | Description |
|---|---|---|
| `customer` | External | Customer records (mobile, PAN, hashes) |
| `leads` | External | Lead lifecycle records |
| `loan` | External | Loan/disbursal records |
| `referrer` | External | Referrer and UTM source records |
| `api_keys` | This service | DSA partner API credentials and rate limits |
| `user_attributions` | This service | Attribution records with 30-day expiry |
| `dsa_api_logs` | This service | Per-request API audit log (90-day retention) |

> **External tables** (`customer`, `leads`, `loan`, `referrer`) are read-only from this service and are owned by upstream systems. Skip those migrations if pointing at a shared database.

### Log retention (dsa_api_logs)

Migration `008` creates a MySQL Event that purges records older than 90 days. The MySQL Event Scheduler must be enabled on your server:

```sql
SET GLOBAL event_scheduler = ON;
-- or add to my.cnf: event_scheduler=ON
```

---

## API

### `POST /customers/check_dedupe`

Checks whether a lead is a duplicate.

**Authentication:** JWE (compact serialization, `Content-Type: application/jose`) + Basic Auth header.

**Request body** (inside the JWE envelope):

```json
{
  "mobile": "9876543210",
  "pancard": "ABCDE1234F",
  "isHash": false
}
```

| Field | Type | Description |
|---|---|---|
| `mobile` | `string` | 10-digit mobile number, or 64-char hex SHA-256 hash when `isHash=true` |
| `pancard` | `string` | PAN in `ABCDE1234F` format, or 64-char hex SHA-256 hash when `isHash=true` |
| `isHash` | `boolean` | Optional. When `true`, fields are treated as pre-hashed. Default `false`. |

**Response:**

```json
{ "status": 200, "success": true, "message": "Dedup Success", "data": {} }
```

```json
{ "status": 200, "success": true, "message": "Dedup Fail", "data": {} }
```

**Dedupe decision logic:**

```
Customer not found                          → Dedup Success
Customer found + active lead or loan        → Dedup Fail
Customer found + no lead/loan:
  No attribution                            → check last lead date (30-day window)
  Active attribution, different UTM         → Dedup Fail
  Active attribution, same UTM              → Dedup Success
  Attribution expired                       → Dedup Success
```

### `GET /health`

```json
{ "status": "ok", "service": "attribution-service" }
```

---

## Rate Limiting

`POST /customers/check_dedupe` is limited to **4 500 requests per minute** per IP.

Per-client limits are stored in `api_keys` (`rate_limit_per_minute`, `rate_limit_per_hour`, `rate_limit_per_day`) but enforcement is handled at the DSA partner level.
