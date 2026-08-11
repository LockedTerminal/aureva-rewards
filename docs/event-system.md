# Event System Documentation

## Overview

The Aureva Rewards event system provides comprehensive event emission, indexing, filtering, history, and real-time monitoring for all state changes across the smart contract ecosystem.

## Architecture

### 1. Contract Layer (Rust/Soroban)

All state-changing operations emit typed events via the `utils::events` module:

```rust
use crate::utils::events;

// Example: emitting a staking event
events::emit_staked(&env, &staker, amount, timestamp);
```

**Benefits:**
- Single source of truth for event definitions
- Type-safe event emission
- Consistent event taxonomy across all contracts
- Easy to audit and maintain

### 2. Backend Layer (Node.js/Express)

The `/api/contract-events` route provides:

- **Indexing**: Manual and automatic event ingestion from Soroban RPC
- **Filtering**: Query by contract, event type, account, ledger range, date range, tx hash
- **History**: Paginated event history with up to 200 events per page
- **Monitoring**: Server-Sent Events (SSE) stream for real-time updates

### 3. Frontend Layer (React Hooks)

Three custom hooks for event consumption:

- `useContractEvents(filters)` — paginated history with filters
- `useEventTypes()` — registry of all known event types
- `useContractEventMonitor(options)` — real-time SSE stream

## Event Taxonomy

All events follow a consistent structure:

| Topic 0        | Topic 1        | Data fields                                  | Trigger                        |
|----------------|----------------|----------------------------------------------|--------------------------------|
| `aur_rwd`     | `init`         | `(admin: Address)`                           | Contract first init            |
| `aur_rwd`     | `bal_set`      | `(user: Address, amount: i128)`              | Admin sets balance             |
| `aur_rwd`     | `staked`       | `(staker: Address, amount: i128, ts: u64)`   | User stakes tokens             |
| `aur_rwd`     | `unstaked`     | `(staker: Address, principal: i128, yield: i128, ts: u64)` | User unstakes |
| `aur_rwd`     | `rate_set`     | `(rate: i128)`                               | Admin updates annual rate      |
| `aur_rwd`     | `swap`         | `(user: Address, aur: i128, xlm: i128, path: Vec<Address>)` | User swaps AUR → XLM |
| `aur_rwd`     | `paused`       | `(procedure: Symbol, ts: u64)`               | Admin pauses contract          |
| `aur_rwd`     | `resumed`      | `(ts: u64)`                                  | Admin resumes contract         |
| `aur_rwd`     | `emrg_pause`   | `(expiry: u64)`                              | Admin emergency-pauses         |
| `aur_rwd`     | `rec_op`       | `(admin: Address)`                           | Recovery admin set             |
| `aur_rwd`     | `snap`         | `(user: Address, balance: i128, ts: u64)`    | Account snapshot taken         |
| `aur_rwd`     | `restore`      | `(user: Address, balance: i128, ts: u64)`    | Account snapshot restored      |
| `aur_rwd`     | `rec_tx`       | `(user: Address, delta: i128, new_bal: i128)`| Recovery transaction applied   |
| `aur_rwd`     | `rec_funds`    | `(from: Address, to: Address, amount: i128)` | Recovery fund transfer         |
| `aur_rwd`     | `upgraded`     | `(wasm_hash: BytesN<32>, version: u32)`      | Contract WASM upgraded