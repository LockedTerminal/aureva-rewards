# Aureva Rewards — Backend API

Node.js/Express API for the Aureva Rewards loyalty platform. Handles merchant campaigns, user rewards, transactions, and blockchain integration via Stellar/Soroban.

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database, Redis, and Stellar credentials

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

**Server runs on:** `http://localhost:3001`

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Basic health check |
| `GET /health/detailed` | Database + Redis connectivity |
| `GET /metrics` | Prometheus metrics |
| `GET /api/docs` | Swagger/OpenAPI documentation |

## Development

### Environment Variables

See `.env.example` for all required variables. Key ones:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/aureva_rewards
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-32+ chars
STELLAR_NETWORK=testnet
ISSUER_PUBLIC=STELLAR_ISSUER_KEY
ISSUER_SECRET=STELLAR_SECRET_KEY
```

### Scripts

```bash
npm run dev              # Start dev server with hot-reload
npm run start            # Start production server
npm test                 # Run unit tests
npm run test:watch       # Watch mode for tests
npm run test:integration # Run integration tests
npm run test:ci          # CI test with coverage
npm run lint             # Run ESLint
npm run security         # Run security tests
npm run migrate          # Run database migrations
npm run migrate:rollback # Rollback last migration
```

### Load Testing

```bash
# Webhook load test
npm run load:webhook

# User balance endpoint
npm run load:balance

# Campaigns list
npm run load:campaigns

# Full suite
npm run load:all
```

## Architecture

### Directory Structure

```
backend/
├── db/                    # Database repositories (Prisma)
├── routes/                # Express route handlers
├── services/              # Business logic
├── middleware/            # Express middleware
├── lib/                   # Utilities (logger, Redis client, etc.)
├── jobs/                  # Background jobs (BullMQ queues)
├── monitoring/            # Observability (logging, metrics)
├── health/                # Health check utilities
├── config/                # Configuration files
├── dtos/                  # Data transfer objects & validation
├── errors/                # Custom error classes
├── __tests__/             # Test files
└── server.js              # Express app entry point
```

### Key Technologies

- **Framework:** Express 5.x
- **Database:** PostgreSQL 16 + Prisma ORM
- **Cache:** Redis 7
- **Auth:** JWT (access + refresh tokens)
- **Job Queue:** BullMQ
- **Logging:** Winston + CloudWatch
- **Metrics:** Prometheus client
- **Blockchain:** Stellar SDK
- **Testing:** Vitest + Supertest
- **Security:** Helmet, CORS, Rate Limiting

## API Routes

### Authentication
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — Login with email/password
- `POST /api/auth/refresh` — Refresh JWT token
- `POST /api/auth/stellar-auth` — Freighter wallet login

### Merchants
- `GET /api/merchants` — List merchants
- `POST /api/merchants` — Create merchant
- `GET /api/merchants/:id` — Get merchant details
- `POST /api/merchants/:id/api-keys` — Generate API key

### Campaigns
- `GET /api/campaigns` — List campaigns
- `POST /api/campaigns` — Create campaign
- `GET /api/campaigns/:id` — Get campaign details
- `PATCH /api/campaigns/:id` — Update campaign

### Rewards & Redemptions
- `GET /api/rewards` — List user rewards
- `POST /api/rewards/issue` — Issue rewards to user
- `POST /api/redemptions` — Redeem reward tokens
- `GET /api/redemptions/:id` — Get redemption status

### Transactions
- `GET /api/transactions` — List user transactions
- `POST /api/transactions/transfer` — Transfer AUR tokens
- `GET /api/transactions/:id` — Get transaction details

### Tokens & Trustlines
- `GET /api/tokens` — Get token info
- `POST /api/trustline` — Create trustline to AUR issuer
- `GET /api/fee-estimate` — Estimate transaction fee

### Wallet
- `GET /api/wallet/balance` — Get user balance
- `GET /api/wallet/address` — Get user address

### Admin
- `GET /api/admin/users` — List all users (admin only)
- `GET /api/admin/email-logs` — Email delivery logs
- `POST /api/admin/` — Admin actions

### Webhooks & Events
- `POST /api/webhooks` — Register webhook
- `POST /api/contract-events` — Process contract events

## Security

### Implemented Measures

- ✅ **Helmet** — OWASP security headers (HSTS, CSP, X-Frame-Options, etc.)
- ✅ **CORS** — Origin validation, only allow configured domains
- ✅ **Rate Limiting** — Global + per-endpoint (login: 5 req/15min, auth: 10 req/15min)
- ✅ **JWT** — Access + refresh token strategy, 7-day expiry
- ✅ **Password Hashing** — bcryptjs with 12 rounds
- ✅ **SQL Injection Prevention** — Prisma parameterized queries
- ✅ **Audit Logging** — All admin/sensitive actions logged
- ✅ **Error Handling** — No sensitive info leaked in responses
- ✅ **Validation** — DTOs validated with class-validator

### Reporting Security Issues

See [`SECURITY.md`](../../SECURITY.md) for vulnerability disclosure policy.

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Coverage
```bash
npm test -- --coverage
```

### CI/CD
```bash
npm run test:ci
```

## Monitoring & Observability

### Logs
- **Format:** Structured JSON via Winston
- **Destinations:** Console (dev), CloudWatch (production)
- **Levels:** DEBUG, INFO, WARN, ERROR

### Metrics
- **Format:** Prometheus metrics
- **Scrape endpoint:** `GET /metrics`
- **Metrics tracked:**
  - Request duration (histogram)
  - Request count (counter)
  - Error rate by endpoint
  - Database query duration
  - Redis operation duration

### Health Checks
- **Basic:** `GET /health` — Returns 200 OK
- **Detailed:** `GET /health/detailed` — Includes database + Redis status

## Deployment

### Docker

```bash
# Build production image
docker build -t aureva-rewards-backend:latest .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=... \
  aureva-rewards-backend:latest
```

### Environment-Specific Setup

#### Development
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/aureva_dev
NODE_ENV=development
STELLAR_NETWORK=testnet
```

#### Staging
```bash
DATABASE_URL=postgresql://...staging...
NODE_ENV=production
STELLAR_NETWORK=testnet
SENTRY_DSN=...
```

#### Production
```bash
DATABASE_URL=postgresql://...prod...
NODE_ENV=production
STELLAR_NETWORK=mainnet
SENTRY_DSN=...
```

## Troubleshooting

### Port already in use
```bash
lsof -i :3001
kill -9 <PID>
```

### Database connection failed
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Run migrations: `npm run migrate`

### Redis connection failed
- Verify `REDIS_URL` is correct
- Check Redis is running: `redis-cli ping`

### JWT errors
- Regenerate keys: `node ./scripts/generate-jwt-keys.js`
- Update `.env` with new keys

## Contributing

1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes and commit: `git commit -m "feat: description"`
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Push and open a PR

See [`CONTRIBUTING.md`](../../CONTRIBUTING.md) for full guidelines.

## License

MIT — See [`LICENSE`](../../LICENSE)
