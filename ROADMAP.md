# Aureva Rewards — Roadmap

This document lists the features deferred from Aureva v1 and planned for future releases. Each item is a genuine engineering opportunity and a candidate for [Drips Wave](https://drips.network/wave) contributor issues.

---

## v2 — Growth & Analytics

| Feature | Complexity | Description |
|---|---|---|
| Analytics dashboard | High | Campaign performance metrics, user engagement stats, time-series charts |
| Referral system | High | On-chain ReferralHub contract + backend service + leaderboard UI |
| Leaderboard | Medium | Weekly/alltime points leaderboard with Redis caching |
| Report export | Medium | CSV/PDF export for campaign transactions and redemptions |
| Campaign analytics API | Medium | Aggregated campaign metrics endpoint for merchant dashboards |
| Pagination improvements | Low | Cursor-based pagination for all list endpoints |

## v2 — DeFi Features

| Feature | Complexity | Description |
|---|---|---|
| Staking module | High | Lock AUR tokens, earn time-proportional yield, unstake flow (contract + API + frontend) |
| Cross-asset swap | High | AUR → XLM via Stellar DEX router (Soroban contract + frontend) |
| Vesting schedules | Medium | Cliff + linear token release for team/investor grants |
| Escrow contract | High | Merchant payment protection with multi-sig + timeout release |

## v2 — Governance

| Feature | Complexity | Description |
|---|---|---|
| Governance contract | High | On-chain proposal creation, token-weighted voting, M-of-N execution |
| Governance frontend | High | Proposal list, voting UI, execution status dashboard |

## v3 — Infrastructure

| Feature | Complexity | Description |
|---|---|---|
| Prometheus + Grafana | Medium | Production monitoring stack with alerting runbooks |
| Fuzz testing suite | High | `cargo-fuzz` property-based security testing for all retained contracts |
| Cloud infrastructure | High | Terraform (AWS) + Kubernetes manifests + Helm chart |
| CI/CD improvements | Medium | Container registry, staging auto-deploys, preview environments |
| Database backup | Low | Automated PostgreSQL backup job + restore test workflow |

## v3 — Developer Experience

| Feature | Complexity | Description |
|---|---|---|
| Documentation site | Medium | Aureva developer docs (API reference, contract guide, SDK usage) |
| SDK improvements | Medium | Better TypeScript types, React hooks, error handling, examples |
| i18n | Medium | Multi-language support using `next-i18next` (already wired in) |
| PWA | Low | Mobile install prompt, offline mode, push notifications |

---

## Good First Issues (v1 scope)

These are smaller tasks within the current Aureva v1 codebase:

- Add JSDoc comments to all backend service functions
- Write missing unit tests for the redemption route
- Add input validation to the campaign creation endpoint
- Improve error messages in wallet authentication flow
- Add rate limiting to the reward claim endpoint
- Write Aureva contracts architecture guide in `docs/`
- Create merchant integration guide
- Add OpenAPI descriptions to all undocumented endpoints

---

## Notes

Items marked as deferred were part of the original Aureva Rewards codebase and can be found in git history. They are not broken — they were intentionally removed from v1 scope to keep the initial surface lean and to create genuine contributor opportunities.

All deferred Soroban contracts (`governance`, `aureva-rewards` (staking), `vesting`, `escrow`, `referral`) are preserved in git history and can be restored as the basis for v2 work.
