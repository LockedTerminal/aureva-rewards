# Aureva Rewards

A programmable loyalty rewards platform built on [Stellar](https://stellar.org) and [Soroban](https://soroban.stellar.org) smart contracts.

Aureva lets merchants create on-chain reward campaigns, issue tokens to users, and allow users to claim and redeem rewards — all anchored to the Stellar ledger.

---

## What Aureva Does

| Capability | Description |
|---|---|
| Reward campaigns | Merchants create campaigns with on-chain parameters |
| Token issuance | AUR tokens minted and distributed to users |
| Merkle-proof claims | Trustless claim distribution via the distribution contract |
| Redemption | Users burn tokens to redeem rewards |
| Wallet auth | Stellar wallet (Freighter) authentication |
| Admin control | Multi-sig admin roles with 2-step transfer |
| Webhooks | On-chain event processing from Soroban |

---

## Repository Structure

```
aureva-rewards/
├── contracts/                  Soroban smart contracts (Rust)
│   ├── aureva_token/             AUR reward token (SEP-0041 compatible)
│   ├── reward_pool/            Custodial reward treasury
│   ├── distribution/           Merkle-proof claim distribution
│   ├── campaign/               On-chain campaign state + upgrade approval
│   ├── redemption/             Reward redemption logic
│   ├── admin_roles/            Multi-sig access control
│   ├── contract_state/         Shared state types
│   └── integration_tests/      Full lifecycle integration test suite
│
├── aurevaRewards/
│   ├── backend/                Node.js/Express API (Prisma + PostgreSQL)
│   ├── frontend/               Next.js 14 application
│   └── blockchain/             Stellar SDK utilities
│
├── packages/
│   └── aureva-contracts-sdk/   TypeScript bindings for Soroban contracts
│
└── scripts/                    Build, deploy, and test scripts
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Rust + `wasm32-unknown-unknown` target (for contracts)
- Soroban CLI (`cargo install --locked soroban-cli`)

### Local setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/aureva-rewards
cd aureva-rewards/aurevaRewards
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database URL, Redis URL, JWT secrets, and Stellar keys

# 3. Run database migrations
npm run migrate

# 4. Start development servers
npm run dev          # starts both backend and frontend

# Backend:  http://localhost:3001
# Frontend: http://localhost:3000
# API docs: http://localhost:3001/api/docs
```

### Smart contracts

```bash
# Build all contracts
cd contracts
cargo build --workspace --target wasm32-unknown-unknown --release

# Run tests
cargo test --workspace

# Deploy to testnet (requires Soroban CLI configured)
cd ..
./scripts/deploy-contracts.sh --network testnet
```

---

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret (32+ chars) |
| `STELLAR_NETWORK` | `testnet` or `public` |
| `HORIZON_URL` | Horizon API endpoint |
| `ISSUER_PUBLIC` / `ISSUER_SECRET` | Stellar distribution account keypair |

---

## Architecture

```
Frontend (Next.js)
      ↓
Backend API (Node.js/Express)
      ↓
PostgreSQL (merchants, campaigns, users, transactions)
Redis (queues, rate limiting, cache)
      ↓
Stellar/Soroban (contracts, token, distribution)
```

Full architecture documentation: [`docs/architecture.md`](docs/architecture.md)

---

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

Aureva is submitted to the [Drips Wave](https://drips.network/wave) open-source contribution program. See [`ROADMAP.md`](ROADMAP.md) for the current list of contributor opportunities.

---

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for the full list of features planned for Aureva v2+, including analytics, referral system, staking, governance, and more.

---

## License

MIT — see [`LICENSE`](LICENSE)
