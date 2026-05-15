# Twin Trades — Agent Reference

> This file is the authoritative reference for AI agents implementing features in this codebase.
> Read it before generating or modifying any code.

---

## Table of Contents

1. [App Overview](#app-overview)
2. [Tech Stack](#tech-stack)
3. [Roles & Permissions](#roles--permissions)
4. [Subscription System](#subscription-system)
5. [Pages & Screens](#pages--screens)
6. [Data Model & Relationships](#data-model--relationships)
7. [Core Features](#core-features)
8. [Background Jobs](#background-jobs)
9. [Authentication & Security](#authentication--security)
10. [API Route Map](#api-route-map)
11. [Rate Limiting](#rate-limiting)
12. [Brokerage Integrations](#brokerage-integrations)

---

## App Overview

Twin Trades is an iOS mobile app (React Native / Expo) backed by a FastAPI (Python) server. Users subscribe, follow curated investment portfolios managed by admins, and the platform automatically rebalances and executes trades through connected brokerage accounts on their behalf. The core value proposition is: _follow a portfolio → connect your brokerage → trades happen automatically_.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo Router), TypeScript |
| State / Data | TanStack Query (`@tanstack/react-query`) |
| Auth storage | `expo-secure-store` via a keychain service |
| Backend | FastAPI (Python 3.12), async SQLAlchemy |
| Database | PostgreSQL (Alembic migrations) |
| Scheduler | APScheduler |
| Subscriptions | Apple In-App Purchase (StoreKit 2) |
| Push notifications | Apple APNS |
| Brokerage OAuth | Alpaca, Schwab, Webull (adapter pattern) |
| Token encryption | AES-256-GCM (brokerage tokens stored encrypted) |

---

## Roles & Permissions

There are three roles, stored in `users.role` (enum `UserRole`).

### `user` — Standard subscriber
- Can browse the Marketplace (requires active subscription)
- Can join / leave portfolios (requires active subscription)
- Can view their own portfolio holdings and return stats
- Can view their own trade history
- Can confirm or reject pending rebalance events
- Can connect / disconnect brokerage accounts
- Can update their profile (display name, avatar, notification preference, phone)
- Can purchase or restore a subscription

### `admin`
Inherits all `user` permissions, plus:
- Access to the Admin section of the app
- Can view, create, edit, toggle visibility (public/private), and delete portfolios
- Can view all users (paginated), edit user fields (`role`, `is_active`, `subscription_exempt`)
- Can remove a user from a portfolio
- Can view the admin changelog (audit log)
- Can view server error logs
- Can view revenue statistics (MRR, total revenue, active subscriptions)
- **Cannot** promote another user to `ultimate_admin`
- **Cannot** edit or delete an `ultimate_admin` account

### `ultimate_admin` — Site Admin
Inherits all `admin` permissions, plus:
- Can permanently delete user accounts (soft-delete with `deleted_at` timestamp)
- Can promote any user to any role including `ultimate_admin`
- Can edit `ultimate_admin` accounts
- The last remaining `ultimate_admin` account **cannot** be deleted (guard enforced in `AdminService.delete_user`)

### `subscription_exempt` flag
A boolean on `User`. When `true`, the user bypasses all subscription checks and is treated as if they have an active `lifetime` plan. The `/subscriptions/status` endpoint returns a synthetic `lifetime` subscription record for exempt users. Typically granted to admins.

### Role enforcement
- Backend: `require_role(*roles)` dependency (see `middleware/RoleMiddleware.py`) — raises `403` if the authenticated user's role is not in the allowed set.
- Frontend: The Admin tab/section is only rendered when `user.role === 'admin' || user.role === 'ultimate_admin'`. On the Users admin screen, certain actions (delete user, assign `ultimate_admin`) are gated behind `isSiteAdmin` (`role === 'ultimate_admin'`).

---

## Subscription System

### Plans

| Plan | `expires_at` |
|---|---|
| `monthly` | Set — renews monthly |
| `annual` | Set — renews annually |
| `lifetime` | `null` — never expires |

### Statuses

| Status | Meaning |
|---|---|
| `active` | Full access to subscription-gated features |
| `grace_period` | Apple's billing retry window; access maintained temporarily |
| `expired` | Subscription lapsed; subscription-gated features blocked |
| `cancelled` | User cancelled; access until `expires_at` then becomes `expired` |

### Flow
1. User taps a subscription product on the Settings screen (iOS only, StoreKit).
2. App calls `POST /subscriptions/verify-apple` with `{ transaction_id, product_id }`.
3. Backend verifies the transaction with the App Store Server API via `StorekitClient`, maps `product_id` → `SubscriptionPlan`, and upserts the `subscriptions` row.
4. The `SubscriptionSync` job runs **daily at midnight UTC** to reconcile Apple's state with the local DB (handles renewals, cancellations, expirations server-side).

### Subscription-gated features
The following require `status === 'active'` or `status === 'grace_period'` (handled via `PortfolioService._assert_subscription`):
- Browsing the Marketplace (`GET /portfolios/marketplace`)
- Joining a portfolio (`POST /portfolios/join`)

Subscription-exempt users pass these checks unconditionally.

---

## Pages & Screens

### Auth Group `(auth)/`

| Screen | File | Purpose |
|---|---|---|
| Login | `(auth)/login.tsx` | Email + password sign-in. Returns JWT access token + refresh token. |
| Register | `(auth)/register.tsx` | New account creation with email, username, display name, password. |
| Forgot Password | `(auth)/forgot-password.tsx` | Sends a 6-digit OTP to the user's email for password reset. |
| Verify OTP | `(auth)/verify-otp.tsx` | Validates the 6-digit OTP (used for password reset and 2FA flows). |
| Reset Password | `(auth)/reset-password.tsx` | Sets a new password after OTP verification. |

### App Group `(app)/`

#### Tabs `(app)/(tabs)/`

| Screen | File | Purpose |
|---|---|---|
| Dashboard | `(tabs)/index.tsx` | Shows the user's followed portfolios as cards. Also surfaces pending rebalance events that require the user's confirm/reject action. Pull-to-refresh syncs both lists. |
| Marketplace | `(tabs)/marketplace.tsx` | Paginated list of all active (public) portfolios not yet joined by the user. Requires an active subscription to view and join. Shows a "Join" button per portfolio. |
| Trades | `(tabs)/trades.tsx` | Paginated, infinite-scroll trade history for the authenticated user. Shows ticker, action (BUY/SELL), quantity, price, status badge, and date. |
| Settings | `(tabs)/settings.tsx` | Profile management, subscription status and purchase flow (iOS IAP), brokerage connections (connect/disconnect via OAuth), biometric auth toggle, change password, delete account, and logout. |

#### Portfolio Detail

| Screen | File | Purpose |
|---|---|---|
| Portfolio Detail | `(app)/portfolio/[id].tsx` | Shows a specific portfolio's stats (return %, holdings count, created date), holdings list with target allocation percentages, and a "Leave Portfolio" button if the user is currently a member. |

#### Change Password

| Screen | File | Purpose |
|---|---|---|
| Change Password | `change-password.tsx` | Accessible post-login for users with `must_change_password = true`. Uses a restricted-scope JWT (`scope: "change_password_only"`). After successful change the user gets a full-access token. |

#### OAuth Callback

| Screen | File | Purpose |
|---|---|---|
| OAuth Redirect | `oauth/` | Deep-link landing screen that receives the OAuth callback from a brokerage and calls `POST /brokerages/oauth/callback` to complete the connection. |

#### Admin Group `(app)/admin/` — visible to `admin` and `ultimate_admin` only

| Screen | File | Purpose |
|---|---|---|
| Admin Dashboard | `admin/index.tsx` | Revenue stats (MRR, total revenue, active subscription count) and navigation cards to sub-sections. |
| Users | `admin/users.tsx` | Paginated user list. Each row shows role badge, subscription status, portfolio count, and invested amount. Admins can edit role/active/subscription_exempt. Site admins can also delete users. |
| Portfolios | `admin/portfolios.tsx` | Paginated portfolio list. Admins can toggle a portfolio public/private (`is_active`) or delete it. |
| Changelog | `admin/changelog.tsx` | Paginated audit log of all admin actions (create/update/delete events on users and portfolios). Each entry shows actor, entity type/ID, action, detail string, and timestamp. |
| Error Logs | `admin/logs.tsx` | Paginated server-side error log entries with severity level, message, optional detail, and timestamp. |

---

## Data Model & Relationships

```
User (1) ─────────────────── (M) UserPortfolio (M) ─────────────── (1) Portfolio
                                   (join table)
User (1) ─────────────────── (M) BrokerageConnection
User (1) ─────────────────── (1) Subscription
User (1) ─────────────────── (M) Trade
Portfolio (1) ──────────────── (M) PortfolioHolding
Portfolio (1) ──────────────── (M) RebalanceEvent
RebalanceEvent (1) ──────────── (M) RebalanceEventHolding  (snapshot of holdings at trigger time)
RebalanceEvent (1) ──────────── (M) Trade                  (via rebalance_event_id)
Trade (M) ──────────────────── (1) BrokerageConnection      (via brokerage_connection_id)
```

### Key tables

#### `users`
Primary user record. Soft-deleted via `deleted_at`. The `must_change_password` flag forces a restricted-scope JWT on login so the user can only call `/auth/change-password` until they comply. `rebalance_confirmation` controls how the user is notified of pending rebalances (`push` | `email` | `sms`).

#### `portfolios`
Created and managed exclusively by admins. `is_active = true` means the portfolio is visible in the Marketplace. `total_return_pct` is a cached value updated hourly by the `PortfolioSync` job. `created_by_id` references the admin who created it (nullable on cascade delete).

#### `portfolio_holdings`
Each row is one ticker allocation for a portfolio. `target_pct` values across all holdings for a given portfolio **must sum to 100**. This constraint is enforced at the service layer.

#### `user_portfolios`
Join table representing a user following a portfolio. `joined_at` is set on join. `left_at` is set (non-null) when a user leaves — the record is kept for history, not hard-deleted. A user "actively follows" a portfolio when `left_at IS NULL`.

#### `portfolio_snapshots`
One row per portfolio per day at 23:59 UTC. Stores `total_value` (NAV). Powers the iOS performance chart on the portfolio detail screen.

#### `subscriptions`
One active subscription record per user. Apple's `transaction_id` is the primary external key. `expires_at` is `null` for lifetime plans. Reconciled nightly by `SubscriptionSync`.

#### `rebalance_events`
Created when an admin triggers a rebalance on a portfolio. Each event has a 30-minute TTL (`expires_at`). Status flow:

```
pending_confirmation → confirmed → executing → completed
                    ↘ rejected
                    ↘ expired  (by cron job if TTL passes)
                    ↘ failed
```

`deep_link` stores a `twintrades://rebalance/{event_id}` URL embedded in push notifications.

#### `rebalance_event_holdings`
Snapshot of the portfolio's holdings at the moment the rebalance was triggered. These are what the trades are based on — not the live portfolio holdings at execution time.

#### `trades`
One row per individual buy/sell order. Linked to the `rebalance_event` that caused it and the `brokerage_connection` used to execute it. Statuses: `pending → filled | cancelled | failed`.

#### `brokerage_connections`
OAuth tokens stored AES-256-GCM encrypted (see `Security.encrypt_brokerage_token`). `brokerage_slug` is one of: `alpaca`, `schwab`, `webull`. A user can have multiple connections (one per brokerage).

#### `otp_tokens`
Short-lived 6-digit codes. `purpose` is either `"login_2fa"` or `"password_reset"`. Hashed with bcrypt.

#### `refresh_tokens`
SHA-256 hashed. 30-day TTL. Rotation on every use (old token revoked, new one issued). All tokens for a user are revoked on logout or password change.

#### `login_audits`
Immutable log of all login attempts (success and failure) with IP and user agent.

---

## Core Features

### Portfolio Following
1. User browses the Marketplace — sees all `is_active` portfolios they have not yet joined.
2. User taps "Join" — `POST /portfolios/join` is called. Subscription is validated server-side.
3. A `UserPortfolio` row is inserted (`left_at = null`).
4. **TODO**: On join, an initial buy order should be triggered to purchase the portfolio's holdings in the correct proportions (`execute_initial_buy` via `TradeService`).
5. User's Dashboard now shows the portfolio card.
6. To leave, user taps "Leave" on the detail screen — `DELETE /portfolios/{id}/leave`. `left_at` is set.
7. **TODO**: On leave, pending rebalances should be cancelled and a full sell should be triggered (`execute_full_sell` via `TradeService`).

### Rebalancing
Rebalancing brings a user's actual brokerage holdings back into alignment with the portfolio's target allocations.

1. An admin (or a future automated trigger) calls `RebalanceService.trigger_rebalance(portfolio_id, triggered_by_id)`.
2. Current portfolio holdings are snapshotted into `rebalance_event_holdings`.
3. A `RebalanceEvent` is created with `status = pending_confirmation` and `expires_at = now + 30 minutes`.
4. Push/email/SMS notifications fan out to all currently enrolled users with the deep link.
5. Each user sees the pending rebalance on their Dashboard. They can **Confirm** or **Reject** it.
6. **Confirm** (`POST /rebalances/{id}/confirm`): Status → `confirmed`. Trades are queued for execution.
7. **Reject** (`POST /rebalances/{id}/reject`): Status → `rejected`. No trades are placed.
8. If neither action is taken within 30 minutes, the `PendingRebalances` cron sets status → `expired`.
9. The rebalance is per-portfolio but the confirmation/rejection is per-user — each enrolled user decides independently whether to participate.

### Brokerage Connection
1. User taps "Connect Brokerage" on the Settings screen.
2. App calls `POST /brokerages/oauth/initiate` with `{ brokerage_slug }`.
3. Backend generates an OAuth state token and returns the brokerage's `auth_url`.
4. App opens the URL in the device browser.
5. User authenticates with their brokerage account.
6. Brokerage redirects back to the app via deep link into `oauth/` screen.
7. App calls `POST /brokerages/oauth/callback` with the `code`, `state`, and `brokerage_slug`.
8. Backend exchanges the code for tokens, encrypts them with AES-256-GCM, and stores them in `brokerage_connections`.
9. The connection appears in Settings. User can disconnect at any time (`DELETE /brokerages/connections/{id}`).

### Trade Execution
Trades are placed via the brokerage adapter (`IBrokerageAdapter.place_order`). Each adapter:
- Decrypts the stored token before making API calls.
- Returns `{ broker_order_id, status, filled_price }`.
- A `Trade` row is created per order with status starting at `pending`, updated to `filled`, `cancelled`, or `failed`.

### Rebalance Notifications
Controlled by the user's `rebalance_confirmation` preference:
- `push` — Apple APNS push notification to the device identified by `apns_device_token`.
- `email` — Email via the `Mailer` integration.
- `sms` — SMS to the user's `phone_number`.

---

## Background Jobs

All jobs are scheduled via APScheduler and run server-side.

| Job | Schedule | Purpose |
|---|---|---|
| `PendingRebalances.expire_pending_rebalances` | Every 30 minutes | Marks `pending_confirmation` rebalance events as `expired` if their `expires_at` has passed. |
| `PortfolioSync.sync_portfolio_returns` | Hourly | Fetches current market prices, recalculates `total_return_pct` for each active portfolio, inserts a `PortfolioSnapshot` row. |
| `SnapshotValues.snapshot_portfolio_values` | Daily at 23:59 UTC | Computes end-of-day NAV for each active portfolio and inserts a `PortfolioSnapshot` record (used for performance charts). |
| `RefreshBrokerageTokens.refresh_expiring_tokens` | Every 6 hours | Finds brokerage connections with tokens expiring within 1 hour and refreshes them via the adapter. |
| `SubscriptionSync.sync_subscriptions` | Daily at midnight UTC | Queries the App Store Server API for all subscriptions and reconciles renewals, expirations, and cancellations with the local DB. |
| `MonthlyReports.send_monthly_reports` | 1st of each month at 08:00 UTC | Compiles the previous month's portfolio performance and trades for each active subscriber and sends a report email. |

---

## Authentication & Security

### Token Flow
- **Access token**: JWT (HS256), 60-minute TTL. Claims: `{ sub: user_id, role, scope? }`.
- **Refresh token**: 32-byte URL-safe random string, SHA-256 hashed before storage, 30-day TTL.
- Rotation: on every `/auth/refresh` call the old refresh token is revoked and a new pair is issued.
- Logout revokes all refresh tokens for the user.

### `must_change_password` / Restricted Scope
When `must_change_password = true` the access token is issued with `scope: "change_password_only"`. The `get_current_user` dependency rejects these tokens with `403`. Only `get_current_user_any_scope` (used by `/auth/change-password`) accepts them. After a successful password change, `must_change_password` is reset to `false` and a normal full-access token is returned.

### Password Security
- bcrypt with 12 rounds for passwords and OTP hashes.
- OTPs are 6-digit codes with bcrypt hash storage and a `used_at` timestamp to prevent replay.

### Brokerage Token Encryption
- AES-256-GCM with a 12-byte random nonce prepended to the ciphertext.
- The key is a 32-byte hex value from `settings.BROKERAGE_ENCRYPTION_KEY`.
- `Security.encrypt_brokerage_token` / `Security.decrypt_brokerage_token` are the only entry points.

### Login Auditing
Every login attempt (success or failure) is written to `login_audits` with IP address and user agent.

---

## API Route Map

### Auth — `/auth`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/login` | — | Login, returns token pair |
| POST | `/auth/register` | — | Register new account |
| POST | `/auth/refresh` | — | Rotate refresh token |
| POST | `/auth/logout` | Bearer | Revoke refresh token |
| POST | `/auth/request-otp` | Bearer | Send OTP to user |
| POST | `/auth/verify-otp` | Bearer | Verify OTP |
| POST | `/auth/change-password` | Bearer (any scope) | Change password |
| POST | `/auth/forgot-password` | — | Trigger password reset OTP |
| POST | `/auth/reset-password` | — | Complete password reset |

### Users — `/users`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/users/me` | Bearer | Fetch own profile |
| PATCH | `/users/me` | Bearer | Update own profile |
| DELETE | `/users/me` | Bearer | Delete own account |

### Portfolios — `/portfolios`
| Method | Path | Auth | Subscription? | Purpose |
|---|---|---|---|---|
| GET | `/portfolios/marketplace` | Bearer | Yes | List joinable portfolios |
| GET | `/portfolios/mine` | Bearer | No | List user's current portfolios |
| GET | `/portfolios/{id}` | Bearer | No | Portfolio detail |
| POST | `/portfolios/join` | Bearer | Yes | Join a portfolio |
| DELETE | `/portfolios/{id}/leave` | Bearer | No | Leave a portfolio |

### Rebalances — `/rebalances`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/rebalances/pending` | Bearer | List pending rebalance events for user |
| POST | `/rebalances/{id}/confirm` | Bearer | Confirm a rebalance |
| POST | `/rebalances/{id}/reject` | Bearer | Reject a rebalance |

### Subscriptions — `/subscriptions`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/subscriptions/status` | Bearer | Get current subscription (or synthetic lifetime for exempt users) |
| POST | `/subscriptions/verify-apple` | Bearer | Verify Apple IAP transaction and upsert subscription |

### Brokerages — `/brokerages`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/brokerages/connections` | Bearer | List user's brokerage connections |
| POST | `/brokerages/oauth/initiate` | Bearer | Start OAuth flow for a brokerage |
| POST | `/brokerages/oauth/callback` | Bearer | Complete OAuth flow |
| DELETE | `/brokerages/connections/{id}` | Bearer | Disconnect a brokerage |

### Trades — `/trades`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/trades` | Bearer | Paginated trade history for user |

### Admin — `/admin` (role: `admin` or `ultimate_admin`)
| Method | Path | Min Role | Purpose |
|---|---|---|---|
| GET | `/admin/users` | admin | Paginated user list with subscription + portfolio stats |
| PATCH | `/admin/users/{id}` | admin | Update user (role, is_active, subscription_exempt) |
| DELETE | `/admin/users/{id}` | ultimate_admin | Soft-delete a user |
| GET | `/admin/portfolios` | admin | Paginated portfolio list |
| POST | `/admin/portfolios` | admin | Create a portfolio |
| PATCH | `/admin/portfolios/{id}` | admin | Update portfolio name/description |
| DELETE | `/admin/portfolios/{id}` | admin | Delete a portfolio |
| PUT | `/admin/portfolios/{id}/holdings` | admin | Replace all holdings (must sum to 100%) |
| PATCH | `/admin/portfolios/{id}/toggle` | admin | Toggle `is_active` (public/private) |
| DELETE | `/admin/portfolios/{id}/users/{uid}` | admin | Remove a user from a portfolio |
| GET | `/admin/logs` | admin | Paginated server error logs |
| GET | `/admin/revenue` | admin | Revenue stats (MRR, total, active subscriptions) |
| GET | `/admin/changelog` | admin | Paginated admin action changelog |

### Webhooks — `/webhooks`
Used for server-to-server callbacks (e.g., App Store Server Notifications).

---

## Rate Limiting

| Limiter | Limit | Applied to |
|---|---|---|
| `auth_limiter` | 10 req / 15 min per IP | `/auth/login`, `/auth/register`, `/auth/refresh` |
| `otp_limiter` | 5 req / 10 min per IP | `/auth/verify-otp`, `/auth/request-otp` |
| `password_reset_limiter` | 5 req / hour per IP | `/auth/forgot-password`, `/auth/reset-password` |
| `api_limiter` | 100 req / min per IP | All other protected user endpoints |
| `admin_limiter` | 200 req / min per IP | All `/admin/*` endpoints |
| `brokerage_auth_limiter` | 10 req / hour per IP | `/brokerages/oauth/initiate` |

---

## Brokerage Integrations

All integrations implement `IBrokerageAdapter` (see `brokerages/Base.py`). Supported slugs: `alpaca`, `schwab`, `webull`. The `BrokerageFactory` selects the correct adapter at runtime.

Each adapter must implement:
- `get_auth_url(state)` — returns the OAuth URL
- `exchange_code(code)` — code → token dict (`access_token`, `refresh_token`, `expires_in`, `account_id`)
- `refresh_token(refresh_token_enc)` — refreshes using the encrypted stored token
- `revoke_token(access_token_enc)` — revokes at the brokerage
- `place_order(access_token_enc, ticker, action, quantity)` → `{ broker_order_id, status, filled_price }`
- `get_positions(access_token_enc)` → `[{ ticker, quantity, market_value }]`

Tokens are **always** passed encrypted to the adapter. The adapter decrypts them internally using `Security.decrypt_brokerage_token` before making API calls. Monetary values must use `Decimal`, never `float`.
