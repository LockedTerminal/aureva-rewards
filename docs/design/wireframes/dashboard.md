# Dashboard UI Design — Aureva Rewards

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-07-23

---

## Layout Overview

The dashboard is the primary authenticated view. It provides a real-time overview of token balance, earned rewards, active campaigns, and transaction history.

---

## Desktop Layout (≥ 1024px)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px fixed)          │  MAIN CONTENT AREA (flex-1)                        │
│                                  │                                                    │
│  ┌────────────────────────────┐  │  ┌──────────────────────────────────────────────┐ │
│  │  ◆ Aureva Rewards            │  │  │  TOPBAR                                      │ │
│  │  v2.0.0                    │  │  │  Dashboard          [🔔] [👤 0xABC...XYZ ▾]  │ │
│  ├────────────────────────────┤  │  └──────────────────────────────────────────────┘ │
│  │                            │  │                                                    │
│  │  [🏠] Dashboard  ←active   │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐
│  │  [⭐] Rewards               │  │  │ AUR Balance│ │Points Earned│ │Active Camps │ │Referrals │
│  │  [📢] Campaigns             │  │  │             │ │             │ │             │ │          │
│  │  [⚡] Staking               │  │  │  1,234.56   │ │   45,670    │ │      8      │ │    12    │
│  │  [👤] Profile               │  │  │  AUR       │ │  points     │ │  campaigns  │ │referrals │
│  │  [⚙️] Settings              │  │  │             │ │             │ │             │ │          │
│  │                            │  │  │  ↑ +12.3%   │ │  ↑ +8.1%   │ │  +2 new     │ │ +$24.50  │
│  │  ─────────────────         │  │  │  vs 7d ago  │ │  vs 7d ago  │ │  this week  │ │ earned   │
│  │                            │  │  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘
│  │  NETWORK                   │  │                                                    │
│  │  [●] Stellar Testnet       │  │  ┌──────────────────────────────┐ ┌──────────────┐ │
│  │                            │  │  │  Rewards Over Time           │ │ Distribution │ │
│  │  [Disconnect Wallet]       │  │  │  [7d] [30d] [90d] [All]      │ │    [Donut]   │ │
│  └────────────────────────────┘  │  │                              │ │              │ │
│                                  │  │  ╭──────────────────────╮    │ │    [●] Earned│ │
│                                  │  │  │  📈 Line Chart Area  │    │ │    [●] Staked│ │
│                                  │  │  │  260px height        │    │ │    [●]Redeemed│
│                                  │  │  ╰──────────────────────╯    │ │              │ │
│                                  │  └──────────────────────────────┘ └──────────────┘ │
│                                  │                                                    │
│                                  │  ┌──────────────────────────────────────────────┐ │
│                                  │  │  Recent Transactions              [View All →]│ │
│                                  │  │  ────────────────────────────────────────── │ │
│                                  │  │  [●] Earn   Coffee House    +50 AUR  2h ago  │ │
│                                  │  │  [●] Redeem $5 Gift Card   -200 AUR  1d ago  │ │
│                                  │  │  [●] Stake  Pool #3         -500 AUR  3d ago  │ │
│                                  │  │  [●] Earn   Bookstore        +30 AUR  5d ago  │ │
│                                  │  └──────────────────────────────────────────────┘ │
│                                  │                                                    │
│                                  │  ┌──────────────────────────────────────────────┐ │
│                                  │  │  Active Campaigns                  [Browse →] │ │
│                                  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐│ │
│                                  │  │  │Coffee House│ │  BookNook  │ │ TechStore  ││ │
│                                  │  │  │ +50 AUR   │ │ +30 AUR   │ │ +100 AUR  ││ │
│                                  │  │  │ per visit  │ │ per $10    │ │ per $50    ││ │
│                                  │  │  │[Earn Now→] │ │[Earn Now→] │ │[Earn Now→] ││ │
│                                  │  │  └────────────┘ └────────────┘ └────────────┘│ │
│                                  │  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tablet Layout (768px – 1023px)

```
┌──────────────────────────────────────────────────┐
│  SIDEBAR (64px icon-only)│  MAIN CONTENT          │
│                           │                        │
│  [◆]   ← Logo            │  TOPBAR                │
│  ────                     │  Dashboard  [🔔] [👤] │
│  [🏠]                     │                        │
│  [⭐]                     │  ┌──────────┐ ┌──────┐│
│  [📢]                     │  │AUR Bal. │ │Points││
│  [⚡]                     │  │ 1,234.56 │ │45,670││
│  [👤]                     │  └──────────┘ └──────┘│
│  [⚙️]                     │                        │
│                           │  ┌──────────┐ ┌──────┐│
│                           │  │Active    │ │Refs  ││
│                           │  │Campaigns │ │  12  ││
│                           │  │    8     │ │      ││
│                           │  └──────────┘ └──────┘│
│                           │                        │
│                           │  [Line Chart - full w] │
│                           │                        │
│                           │  [Recent Transactions] │
└──────────────────────────────────────────────────┘
```

---

## Mobile Layout (< 768px)

```
┌─────────────────────────────────────┐
│  TOPBAR                             │
│  [☰] Aureva Rewards   [🔔] [👤]      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ← swipe left/right for cards →     │
│  ┌─────────────────────────────┐    │
│  │  AUR Balance               │    │
│  │  1,234.56 AUR              │    │
│  │  ↑ +12.3% vs last week      │    │
│  │  [Send] [Stake] [Receive]   │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Quick Stats                        │
│  Points: 45,670  Campaigns: 8  Refs: 12
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Recent Transactions      [View All]│
│  ● +50 AUR  Coffee House  2h ago   │
│  ● -200 AUR Redeem Card   1d ago   │
│  ● -500 AUR Staked        3d ago   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Active Campaigns         [Browse]  │
│  [Card] [Card] [Card] → scroll     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  BOTTOM NAV BAR                     │
│  [🏠]   [⭐]  [📢]   [⚡]  [👤]   │
│  Home Rewards Camps Stake Profile  │
└─────────────────────────────────────┘
```

---

## KPI Cards Specification

Each KPI card shows a key metric with trend data.

### Structure
```
┌──────────────────────────────┐
│  [Icon 20px]  Label (label)  │
│                              │
│  1,234.56                    │  ← Primary metric (5xl bold)
│  AUR tokens                 │  ← Unit/context (body-sm neutral-500)
│                              │
│  ↑ +12.3%  vs last 7 days    │  ← Trend (caption, success/error color)
│  ████████░░  [sparkline]     │  ← 60×24px sparkline
└──────────────────────────────┘
```

### Four KPI Cards

| Card | Metric | Unit | Icon | Trend Color |
|------|--------|------|------|-------------|
| AUR Balance | `balance` AUR | "tokens" | `WalletIcon` | success/error |
| Points Earned | `points` | "points earned" | `StarIcon` | success/error |
| Active Campaigns | `campaigns` | "active campaigns" | `MegaphoneIcon` | neutral |
| Referrals | `referrals` | "referrals" | `UsersIcon` | success/error |

### Responsive Grid

- Desktop: `grid-cols-4` gap-4
- Tablet: `grid-cols-2` gap-4
- Mobile: `grid-cols-2` gap-3 (compact variant, no sparkline)

---

## Sidebar Specification

### Desktop (240px wide)

| Element | Details |
|---------|---------|
| Logo area | 64px height, logo + wordmark |
| Nav items | 48px height each, icon (20px) + label |
| Active state | `primary-50` bg, `primary-600` icon + text, `primary-600` left border 3px |
| Hover state | `neutral-50` bg |
| Focus | 2px ring, inset |
| Divider | Before Settings and Network sections |
| Network badge | Dot indicator (green=mainnet, yellow=testnet) |
| Wallet button | Ghost style, truncated address, disconnect on hover |
| Version | Caption text, neutral-400, bottom of sidebar |

### Tablet (64px icon-only)

- Same icons, no labels
- Tooltip on hover showing label
- Active: `primary-50` bg pill around icon

### Mobile (bottom navigation)

- 5 tabs: Home / Rewards / Campaigns / Staking / Profile
- Height: 64px + safe-area-inset-bottom
- Active tab: icon + label in `primary-600`
- Inactive: icon + label in `neutral-400`
- Background: `white` with `border-t neutral-200`
- Notification dot on Campaigns when there are new campaigns

---

## Topbar Specification

| Element | Desktop | Mobile |
|---------|---------|--------|
| Left | Breadcrumb / page title | Hamburger + Logo |
| Center | — | — |
| Right | Notification bell + Wallet menu | Notification bell + Avatar |

### Wallet Menu (Dropdown)

```
[0xABC...XYZ ▾]  ← truncated address
     ↓ open
┌─────────────────────────┐
│  Connected Wallet        │
│  0xABC...XYZ            │
│  ● Stellar Testnet      │
├─────────────────────────┤
│  Copy Address           │
│  View on Explorer       │
├─────────────────────────┤
│  Disconnect Wallet      │  ← danger style
└─────────────────────────┘
```

---

## Transactions List

| Column | Width | Content |
|--------|-------|---------|
| Type dot | 8px | Color coded: earn=success, redeem=warning, stake=info |
| Description | flex-1 | Merchant name or action |
| Amount | 100px | `+/- X AUR` (green for earn, red for spend) |
| Date | 80px | Relative time (2h ago, 1d ago) |

### Empty State

```
┌──────────────────────────────────────────────────┐
│                                                  │
│          [Clock icon — 48px, neutral-300]        │
│          No transactions yet                     │
│          Start earning by joining a campaign     │
│                                                  │
│          [Browse Campaigns →]                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Loading States

All data sections have skeleton loading states. See `components/Skeleton.js`:

- KPI cards → `SkeletonDashboard`
- Charts → `SkeletonAnalytics`
- Transactions → `SkeletonTransactionHistory`
- Campaigns → `SkeletonGrid`
- Merchant dashboard → `SkeletonMerchantDashboard`

---

## Accessibility

- Main landmark: `<main id="dashboard-content">`
- KPI cards: `role="region"` with `aria-label="Key metrics"`
- Charts: `<figure>` with `<figcaption>` text summary of data
- Live balance: `aria-live="polite"` for real-time updates
- Transaction list: `<table>` with proper `<th>` and `scope` attributes
- Skip link: "Skip to main content" at top of page
