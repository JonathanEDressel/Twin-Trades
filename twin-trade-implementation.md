# TwinTrades
## Agent Implementation Plan

**Native iOS (Swift / SwiftUI) · Python / FastAPI Backend · MySQL 8+**

> **CONFIDENTIAL — AGENT SPECIFICATION DOCUMENT**

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project File Structure](#project-file-structure)
4. [Layer Responsibilities](#layer-responsibilities--what-goes-where)
5. [File Content Contracts](#file-content-contracts)
6. [Database Schema](#database-schema)
7. [Role & Permission Matrix](#role--permission-matrix)
8. [Subscription Plans — iOS + StoreKit 2](#subscription-plans--ios--storekit-2)
9. [Rebalance Confirmation Flow](#rebalance-confirmation-flow)
10. [Default Admin Seed & Change Log](#default-admin-seed--change-log)
11. [Revenue Page](#revenue-page-adminrevenue)
12. [Security Requirements](#security-requirements)
13. [iOS Design System](#ios-design-system-replaces-css-architecture)
14. [Coding Practices Guide](#coding-practices-guide)
15. [Cron / Scheduled Jobs](#cron--scheduled-jobs-apscheduler)
16. [Environment Variables](#environment-variables)
17. [Implementation Order for Agent](#implementation-order-for-agent)
18. [Critical Notes for Agent](#critical-notes-for-agent)

---

## Overview

A **native iOS application** built with Swift and SwiftUI on the frontend, Python with FastAPI on the backend, and MySQL 8+ as the database. The app ships through the Apple App Store as a real iOS binary — not a web app, not a WebView wrapper, not a PWA. Users subscribe to mirror politician and insider investment portfolios. **Webull** is the primary supported brokerage with an adapter layer for future additions. **StoreKit 2** handles all subscription billing inside the iOS app, fully compliant with Apple App Store Review Guideline 3.1.1.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **iOS Frontend** | Swift 5.9+, SwiftUI, Combine, Swift Concurrency (`async/await`) |
| Architecture | MVVM + Coordinator, `@Observable` / `ObservableObject` |
| Networking | `URLSession` + custom `APIClient` actor, `Codable` |
| Secure Storage | Keychain Services (tokens, refresh tokens) |
| Biometrics | `LocalAuthentication` (Face ID / Touch ID) |
| Push Notifications | APNs via `UserNotifications` |
| In-App Purchase | **StoreKit 2** (`Product`, `Transaction`, `AppStore.sync()`) |
| Charts | Swift Charts (iOS 16+) |
| Min iOS | iOS 16.0 |
| Dependency Mgr | Swift Package Manager |
| **Backend** | Python 3.11+, FastAPI, Uvicorn (ASGI), Gunicorn (prod) |
| ORM / Migrations | SQLAlchemy 2.0 (async) + Alembic, `asyncmy` MySQL driver |
| Validation | Pydantic v2 |
| Auth | JWT via `python-jose`, `passlib[bcrypt]` |
| 2FA | `pyotp`, `aiosmtplib` (email OTP), Twilio SDK (SMS OTP) |
| Payments | `app-store-server-library` (StoreKit 2 server validation) |
| Brokerage | Adapter pattern — Webull (primary), Alpaca + Schwab (stubs) |
| Scheduler | APScheduler (AsyncIOScheduler) — upgrade to Celery + Redis at scale |
| Email | `aiosmtplib` + Jinja2 templates (or SendGrid SDK) |
| File Storage | AWS S3 via `aioboto3` (or Cloudinary) |
| Logging | `structlog` + MySQL `error_logs` table |
| Rate Limiting | `slowapi` (per-route granular config) |
| Push to iOS | `aioapns` (direct APNs) |
| Testing | `pytest`, `pytest-asyncio`, `httpx` (backend); XCTest + XCUITest (iOS) |

---

## Project File Structure

### Backend — Python / FastAPI

```
backend/
├── app/
│   ├── controllers/              ← Request handler + DB context per domain (Controller + DbContext pair)
│   │   ├── AuthController.py             # login, register, refresh, OTP endpoints
│   │   ├── AuthDbContext.py              # refresh_tokens, otp_tokens queries
│   │   ├── BrokerageController.py        # OAuth initiation, connection management
│   │   ├── BrokerageDbContext.py         # brokerage_connections queries
│   │   ├── PortfolioController.py        # marketplace, join, leave, holdings
│   │   ├── PortfolioDbContext.py         # portfolios, holdings, user_portfolios queries
│   │   ├── RebalanceController.py        # pending list, confirm, reject
│   │   ├── RebalanceDbContext.py         # rebalance_events, pending_rebalances queries
│   │   ├── SubscriptionController.py     # StoreKit verify, status
│   │   ├── SubscriptionDbContext.py      # subscriptions queries
│   │   ├── TradeController.py            # trade history
│   │   ├── TradeDbContext.py             # trade_history, user_trade_history, trades queries
│   │   ├── UserController.py             # profile, self-delete
│   │   ├── UserDbContext.py              # users, login_audit, monthly_snapshots queries
│   │   ├── AdminController.py            # admin user & portfolio management
│   │   ├── AdminDbContext.py             # change_log, error_logs queries
│   │   └── WebhookController.py          # Apple Server Notifications V2
│   │
│   ├── services/                 ← Business logic only. No HTTP, no raw SQL.
│   │   ├── AuthService.py
│   │   ├── BrokerageService.py
│   │   ├── ChangeLogService.py
│   │   ├── EmailService.py
│   │   ├── PortfolioService.py
│   │   ├── PushService.py                # APNs dispatch
│   │   ├── RebalanceService.py
│   │   ├── StorekitService.py            # Apple receipt / transaction validation
│   │   ├── SubscriptionService.py
│   │   ├── TradeService.py
│   │   └── UserService.py
│   │
│   ├── models/                   ← SQLAlchemy ORM table definitions
│   │   ├── Base.py
│   │   ├── UserModel.py
│   │   ├── PortfolioModel.py
│   │   ├── SubscriptionModel.py
│   │   ├── TradeModel.py
│   │   └── BrokerageModel.py
│   │
│   ├── schemas/                  ← Pydantic v2 request/response models
│   │   ├── Auth.py               # LoginPayload, TokenPayload, OtpPayload
│   │   ├── Brokerage.py
│   │   ├── ChangeLog.py
│   │   ├── Portfolio.py
│   │   ├── Rebalance.py
│   │   ├── Subscription.py
│   │   ├── Trade.py
│   │   └── User.py
│   │
│   ├── helper/                   ← Cross-cutting utilities
│   │   ├── Config.py             # Pydantic Settings — all env vars
│   │   ├── Database.py           # async engine + session factory
│   │   ├── Security.py           # bcrypt, JWT, AES-256-GCM, OTP
│   │   ├── ErrorHandler.py       # Custom exceptions + global FastAPI handlers
│   │   ├── Logger.py             # structlog config
│   │   └── MigrateDatabase.py    # Alembic invocation helpers
│   │
│   ├── middleware/
│   │   ├── AuthMiddleware.py             # FastAPI dependency: get_current_user
│   │   ├── RoleMiddleware.py             # require_role("admin", "ultimate_admin")
│   │   └── RateLimiters.py              # slowapi limiters
│   │
│   ├── brokerages/
│   │   ├── Base.py                       # IBrokerageAdapter (ABC)
│   │   ├── Factory.py                    # Webull registered first (primary)
│   │   ├── webull/
│   │   │   ├── Adapter.py                ← FULLY IMPLEMENTED
│   │   │   └── Client.py
│   │   ├── alpaca/                       ← Coming Soon stub
│   │   └── schwab/                       ← Coming Soon stub
│   │
│   ├── jobs/                     ← APScheduler coroutine tasks
│   │   ├── MonthlyReports.py
│   │   ├── PendingRebalances.py
│   │   ├── PortfolioSync.py
│   │   ├── RefreshBrokerageTokens.py
│   │   ├── SnapshotValues.py
│   │   └── SubscriptionSync.py
│   │
│   ├── integrations/
│   │   ├── StorekitClient.py             # App Store Server API client
│   │   ├── ApnsClient.py
│   │   └── Mailer.py
│   │
│   ├── Routes.py                 ← All FastAPI router registration (flat, one file)
│   └── Server.py                 ← FastAPI app factory + lifespan (APScheduler bootstrap)
│
├── alembic/
│   ├── env.py
│   └── versions/                 ← Migrations in order
│       ├── 000_seed_ultimate_admin.py    ← RUN FIRST
│       ├── 001_users.py
│       ├── 002_brokerage_connections.py
│       ├── 003_subscriptions.py
│       └── … (004 through 018)
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
│
├── pyproject.toml                # Poetry or PDM
├── alembic.ini
├── Dockerfile
├── .env.example
└── README.md
```

### iOS Frontend — Swift / SwiftUI

```
TwinTrades/
├── TwinTrades.xcodeproj
├── TwinTrades/
│   ├── App/
│   │   ├── TwinTradesApp.swift           ← @main entry point, SwiftUI App
│   │   ├── AppConfig.swift               # API base URL, feature flags, env
│   │   ├── AppCoordinator.swift          # Top-level navigation flow
│   │   └── AppDelegate.swift             # APNs registration, launch options
│   │
│   ├── Views/                    ← SwiftUI views (presentation only)
│   │   ├── Overview/                     # Main authenticated screens
│   │   │   ├── DashboardView.swift
│   │   │   ├── MarketplaceView.swift
│   │   │   ├── PortfolioDetailView.swift
│   │   │   ├── TradeHistoryView.swift
│   │   │   └── SettingsView.swift
│   │   ├── Admin/                        # Admin panel screens
│   │   │   ├── AdminDashboardView.swift
│   │   │   ├── AdminPortfoliosView.swift
│   │   │   ├── AdminUsersView.swift
│   │   │   ├── AdminLogsView.swift
│   │   │   ├── AdminAnalyticsView.swift
│   │   │   ├── AdminRevenueView.swift
│   │   │   └── AdminChangeLogView.swift
│   │   ├── Components/                   # Shared reusable UI components
│   │   │   ├── PortfolioCardView.swift
│   │   │   ├── RebalanceConfirmSheet.swift
│   │   │   ├── PrimaryButton.swift
│   │   │   ├── ToastView.swift
│   │   │   └── LoadingOverlay.swift
│   │   ├── LoginView.swift
│   │   ├── RegisterView.swift
│   │   ├── ForgotPasswordView.swift
│   │   ├── ResetPasswordView.swift
│   │   └── ChangePasswordView.swift
│   │
│   ├── ViewModels/               ← @Observable classes: state + actions
│   │   ├── Overview/
│   │   │   ├── DashboardViewModel.swift
│   │   │   ├── MarketplaceViewModel.swift
│   │   │   ├── PortfolioDetailViewModel.swift
│   │   │   ├── TradeHistoryViewModel.swift
│   │   │   └── SettingsViewModel.swift
│   │   ├── Admin/
│   │   │   ├── AdminDashboardViewModel.swift
│   │   │   ├── AdminPortfoliosViewModel.swift
│   │   │   ├── AdminUsersViewModel.swift
│   │   │   ├── AdminLogsViewModel.swift
│   │   │   ├── AdminAnalyticsViewModel.swift
│   │   │   ├── AdminRevenueViewModel.swift
│   │   │   └── AdminChangeLogViewModel.swift
│   │   ├── LoginViewModel.swift
│   │   ├── RegisterViewModel.swift
│   │   ├── ForgotPasswordViewModel.swift
│   │   └── ChangePasswordViewModel.swift
│   │
│   ├── Styles/                   ← SwiftUI ViewModifier & style extension files (mirrors CSS layer)
│   │   ├── Overview/
│   │   │   ├── DashboardStyle.swift      # card layouts, grid spacing
│   │   │   ├── MarketplaceStyle.swift    # portfolio list styling
│   │   │   ├── PortfolioDetailStyle.swift
│   │   │   └── TradeHistoryStyle.swift
│   │   ├── AdminStyle.swift              # admin panel shared styles
│   │   └── AuthStyle.swift              # login / register / password screens
│   │
│   ├── Services/                 ← API / platform service layer
│   │   ├── Controllers/          ← Per-domain networking request builders
│   │   │   ├── AuthController.swift
│   │   │   ├── BrokerageController.swift
│   │   │   ├── PortfolioController.swift
│   │   │   ├── SubscriptionController.swift
│   │   │   ├── TradeController.swift
│   │   │   ├── UserController.swift
│   │   │   └── AdminController.swift
│   │   ├── Networking/
│   │   │   ├── APIClient.swift           # actor-based HTTP client
│   │   │   ├── APIEndpoint.swift         # enum of endpoints
│   │   │   ├── APIError.swift
│   │   │   └── RequestInterceptor.swift  # JWT attach + refresh
│   │   ├── AuthService.swift
│   │   ├── BrokerageService.swift
│   │   ├── PortfolioService.swift
│   │   ├── SubscriptionService.swift
│   │   ├── TradeService.swift
│   │   ├── UserService.swift
│   │   ├── AdminService.swift
│   │   ├── StoreKitService.swift         # StoreKit 2 IAP wrapper
│   │   ├── PushNotificationService.swift
│   │   ├── BiometricsService.swift
│   │   └── KeychainService.swift         # token storage
│   │
│   ├── Models/                   ← Codable structs matching API
│   │   ├── User.swift
│   │   ├── Portfolio.swift
│   │   ├── PortfolioHolding.swift
│   │   ├── Subscription.swift
│   │   ├── Trade.swift
│   │   ├── Brokerage.swift
│   │   ├── RebalanceEvent.swift
│   │   └── AuthToken.swift
│   │
│   ├── Helper/                   ← Pure utilities (mirrors backend helper/)
│   │   ├── Formatters.swift              # currency, percent, date
│   │   ├── Validators.swift              # email, password rules
│   │   ├── DesignTokens.swift            # Colors, Spacing, Radii, Typography
│   │   └── Extensions/
│   │       ├── Date+.swift
│   │       ├── Decimal+.swift            # money safe
│   │       ├── String+.swift
│   │       └── View+.swift
│   │
│   ├── Resources/
│   │   ├── Assets.xcassets
│   │   │   ├── AppIcon.appiconset
│   │   │   ├── AccentColor.colorset
│   │   │   └── Colors/                   # brand color sets (light/dark)
│   │   ├── Localizable.xcstrings
│   │   └── Fonts/
│   │
│   ├── Info.plist
│   └── TwinTrades.entitlements            # Keychain, Push, ASWebAuth, etc.
│
├── TwinTradesTests/              # XCTest unit tests
├── TwinTradesUITests/            # XCUITest UI tests
└── Packages/                     # Local Swift packages (if any)
```

---

## Layer Responsibilities — What Goes Where

### Backend Layers

| Layer | Responsibility | Must NOT Contain |
|---|---|---|
| `controllers/[Domain]Controller.py` | Parse Pydantic body, call service, return response model. | Raw SQL, business logic, direct DB sessions |
| `controllers/[Domain]DbContext.py` | SQLAlchemy queries for one domain table group. Parameterized only. | Business logic, validation, HTTP concerns |
| `services/` | Business logic, orchestration, calls DbContext classes. | `Request`/`Response` objects, SQL strings, HTTP status codes |
| `schemas/` | Pydantic v2 models for request/response validation. | Functions, DB calls, business rules |
| `models/` | SQLAlchemy ORM table definitions only. | Business logic, HTTP |
| `helper/` | Config, DB session factory, security primitives, error handler, logger. | DB queries, business rules |
| `middleware/` | FastAPI dependencies: JWT verify, role check, rate limit. | Business logic, direct DB access beyond user lookup |
| `brokerages/` | OAuth + order execution behind `IBrokerageAdapter`. | Business logic unrelated to the brokerage API |
| `jobs/` | APScheduler coroutine tasks (call services, never controllers). | HTTP, `Request`/`Response` |
| `integrations/` | Initialize and export third-party SDK clients. | Business logic |
| `Routes.py` | All FastAPI `APIRouter` path registrations + dependencies (auth, rate limit). | Logic, DB calls, business rules |
| `Server.py` | FastAPI app factory, middleware registration, APScheduler lifespan. | Route logic, business rules |

### iOS Frontend Layers

| Layer | Responsibility | Must NOT Contain |
|---|---|---|
| `Views/` | SwiftUI declarative UI. Binds to a ViewModel. Auth views top-level; `Overview/` and `Admin/` sub-grouped. | Direct networking, persistence, business logic |
| `ViewModels/` | `@Observable` / `ObservableObject` state owner. Orchestrates services. Mirrors `Views/` folder grouping. | `URLSession` calls directly, SwiftUI view code, raw Keychain calls |
| `Styles/` | SwiftUI `ViewModifier` structs and style extensions, grouped by screen section. No layout logic. | State, networking, navigation |
| `Services/Controllers/` | Per-domain networking request builders. Compose `APIEndpoint` calls, parse responses. | Business logic, SwiftUI, Keychain |
| `Services/Networking/` | `APIClient` actor, endpoint enum, error types, token interceptor. | Domain logic, SwiftUI |
| `Services/` (root) | Domain service wrappers (Auth, Portfolio, etc.) calling `Controllers/`. | SwiftUI types, `@State`, view logic |
| `Models/` | `Codable` / `Identifiable` structs matching API shapes. | Functions with side effects, networking |
| `Helper/` | Pure utilities, extensions, formatters, validators, design tokens. | API calls, navigation, persistence |
| `App/` | App entry, coordinator, config, APNs registration. | Page-specific logic |
| `Resources/` | Assets, colors, fonts, localization. | Swift code |

---

## File Content Contracts

These examples show the exact structure every file in each layer must follow. Deviating from these patterns breaks layer separation and creates unmaintainable code.

### Backend Routes (Routes.py)

```python
# app/Routes.py
# ROUTE REGISTRATION ONLY — zero logic. Dependencies + delegate to controller.
from fastapi import APIRouter, Depends
from app.controllers.UserController import UserController
from app.controllers.AdminController import AdminController
from app.middleware.AuthMiddleware import get_current_user
from app.middleware.RoleMiddleware import require_role
from app.middleware.RateLimiters import api_limiter, admin_limiter
from app.schemas.User import UserResponse

router = APIRouter(prefix="/users", tags=["users"])

# User self-service
router.get("/me", response_model=UserResponse,
           dependencies=[Depends(api_limiter)])(UserController.get_me)
router.patch("/me", response_model=UserResponse,
             dependencies=[Depends(api_limiter)])(UserController.update_me)
router.delete("/me", status_code=204,
              dependencies=[Depends(api_limiter)])(UserController.delete_me)

# Admin user management
router.get("/", response_model=list[UserResponse],
           dependencies=[Depends(require_role("admin", "ultimate_admin")),
                         Depends(admin_limiter)])(AdminController.list_users)
router.patch("/{user_id}", response_model=UserResponse,
             dependencies=[Depends(require_role("admin", "ultimate_admin")),
                           Depends(admin_limiter)])(AdminController.update_user)
router.delete("/{user_id}", status_code=204,
              dependencies=[Depends(require_role("ultimate_admin")),
                            Depends(admin_limiter)])(AdminController.delete_user)
```

### Backend Controller

```python
# app/controllers/UserController.py
from fastapi import Depends
from app.services.UserService import UserService
from app.schemas.User import UserUpdatePayload, UserResponse
from app.middleware.AuthMiddleware import get_current_user
from app.models.UserModel import User
from app.helper.Database import get_session
from sqlalchemy.ext.asyncio import AsyncSession


class UserController:

    @staticmethod
    async def get_me(
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
    ) -> UserResponse:
        # Controller: no SQL, no logic. Just delegate.
        return await UserService.get_by_id(session, current_user.id)

    @staticmethod
    async def update_me(
        payload: UserUpdatePayload,  # Pydantic validates automatically
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
    ) -> UserResponse:
        return await UserService.update_self(session, current_user.id, payload)
```

### Backend DbContext

```python
# app/controllers/UserDbContext.py
# SQLAlchemy queries ONLY. No business logic. No HTTP.
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.UserModel import User


class UserDbContext:

    @staticmethod
    async def find_by_id(session: AsyncSession, user_id: int) -> User | None:
        result = await session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def find_by_email(session: AsyncSession, email: str) -> User | None:
        result = await session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_by_id(session: AsyncSession, user_id: int, fields: dict) -> None:
        if not fields:
            return
        await session.execute(
            update(User).where(User.id == user_id).values(**fields)
        )
        await session.flush()
```

### Backend Service

```python
# app/services/UserService.py
# Business logic. Calls DbContext. No HTTP. No raw SQL.
from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.UserDbContext import UserDbContext
from app.helper.Security import Security
from app.helper.ErrorHandler import NotFoundError
from app.schemas.User import UserUpdatePayload, UserResponse


class UserService:

    @staticmethod
    async def get_by_id(session: AsyncSession, user_id: int) -> UserResponse:
        user = await UserDbContext.find_by_id(session, user_id)
        if not user:
            raise NotFoundError("User not found")
        return UserResponse.model_validate(user)  # strips sensitive fields

    @staticmethod
    async def update_self(
        session: AsyncSession, user_id: int, payload: UserUpdatePayload
    ) -> UserResponse:
        fields = payload.model_dump(exclude_unset=True, exclude={"role"})
        if "password" in fields:
            fields["password_hash"] = Security.hash_password(fields.pop("password"))
        await UserDbContext.update_by_id(session, user_id, fields)
        await session.commit()
        return await UserService.get_by_id(session, user_id)
```

### iOS Networking Client

```swift
// Services/Networking/APIClient.swift
// Actor-isolated HTTP client. Handles JWT attach + automatic refresh.
import Foundation

actor APIClient {
    static let shared = APIClient()
    private let session: URLSession = .shared
    private let decoder = JSONDecoder.apiDecoder
    private let encoder = JSONEncoder.apiEncoder

    func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        var request = try endpoint.urlRequest()
        if endpoint.requiresAuth {
            let token = try await KeychainService.shared.accessToken()
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        if http.statusCode == 401, endpoint.requiresAuth {
            try await AuthService.shared.refreshTokens()
            return try await self.request(endpoint) // retry once
        }
        guard (200..<300).contains(http.statusCode) else {
            throw APIError.server(status: http.statusCode, data: data)
        }
        return try decoder.decode(T.self, from: data)
    }
}
```

### iOS Domain Service

```swift
// Services/PortfolioService.swift
// API calls only. No SwiftUI. No navigation. Returns typed models.
import Foundation

struct PortfolioService {
    static let shared = PortfolioService()

    func fetchMyPortfolios() async throws -> [Portfolio] {
        try await APIClient.shared.request(.getMyPortfolios)
    }

    func fetchPendingRebalances() async throws -> [PendingRebalance] {
        try await APIClient.shared.request(.getPendingRebalances)
    }

    func joinPortfolio(
        portfolioId: Int, brokerageConnectionId: Int, amount: Decimal
    ) async throws -> Portfolio {
        try await APIClient.shared.request(
            .joinPortfolio(
                id: portfolioId,
                body: .init(
                    brokerageConnectionId: brokerageConnectionId,
                    amount: amount
                )
            )
        )
    }

    func confirmRebalance(portfolioId: Int, eventId: Int) async throws {
        let _: EmptyResponse = try await APIClient.shared.request(
            .confirmRebalance(portfolioId: portfolioId, eventId: eventId)
        )
    }
}
```

### iOS ViewModel

```swift
// ViewModels/User/DashboardViewModel.swift
// @Observable state container. Owns data, exposes intents. No SwiftUI.
import Foundation
import Observation

@Observable
final class DashboardViewModel {
    enum State { case idle, loading, loaded, error(String) }

    private(set) var state: State = .idle
    private(set) var portfolios: [Portfolio] = []
    private(set) var pendingRebalances: [PendingRebalance] = []

    @MainActor
    func load() async {
        state = .loading
        do {
            async let portfoliosTask = PortfolioService.shared.fetchMyPortfolios()
            async let rebalancesTask = PortfolioService.shared.fetchPendingRebalances()
            self.portfolios = try await portfoliosTask
            self.pendingRebalances = try await rebalancesTask
            state = .loaded
        } catch {
            state = .error("Failed to load portfolios.")
        }
    }

    @MainActor
    func confirmRebalance(portfolioId: Int, eventId: Int) async {
        do {
            try await PortfolioService.shared.confirmRebalance(
                portfolioId: portfolioId, eventId: eventId
            )
            await load()
        } catch {
            state = .error("Could not confirm rebalance.")
        }
    }
}
```

### iOS View

```swift
// Views/User/DashboardView.swift
// SwiftUI only. No networking. Observes ViewModel.
import SwiftUI

struct DashboardView: View {
    @State private var vm = DashboardViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DesignTokens.Spacing.lg) {
                    if !vm.pendingRebalances.isEmpty {
                        PendingRebalanceBanner(rebalances: vm.pendingRebalances) { event in
                            Task {
                                await vm.confirmRebalance(
                                    portfolioId: event.portfolioId,
                                    eventId: event.id
                                )
                            }
                        }
                    }
                    LazyVGrid(
                        columns: [GridItem(.adaptive(minimum: 300))],
                        spacing: DesignTokens.Spacing.lg
                    ) {
                        ForEach(vm.portfolios) { portfolio in
                            NavigationLink(value: portfolio) {
                                PortfolioCardView(portfolio: portfolio)
                            }
                        }
                    }
                }
                .padding(DesignTokens.Spacing.md)
            }
            .navigationTitle("Dashboard")
            .navigationDestination(for: Portfolio.self) { PortfolioDetailView(portfolio: $0) }
            .refreshable { await vm.load() }
            .task { await vm.load() }
            .overlay { if case .loading = vm.state { LoadingOverlay() } }
        }
    }
}
```

---

## Database Schema

Run all Alembic migration files in the exact order listed. Migration `000` must run first — it seeds the default `ultimate_admin` account.

| Migration | Description |
|---|---|
| `000_seed_ultimate_admin` | Creates default ultimate_admin. `admin@app.local` / `Admin@123!`, `must_change_password=TRUE`. |
| `001_users` | id, email, username, password_hash, role (`user\|admin\|ultimate_admin`), subscription_exempt, rebalance_confirmation, must_change_password, **apple_user_id** (Sign in with Apple), **device_tokens** (APNs) |
| `002_brokerage_connections` | Per-user brokerage OAuth tokens (AES-256-GCM). Unlimited brokerages via `brokerage_slug`. |
| `003_subscriptions` | Plan (`monthly\|annual\|lifetime`), status, period dates, **provider** (`storekit`), **original_transaction_id** (StoreKit). Lifetime rows have `current_period_end=NULL`. |
| `004_portfolios` | name, description, cover_image_url, politician_name, is_active, return_1d/1w/1m/1y, total_invested |
| `005_portfolio_holdings` | ticker + allocation_pct per portfolio. App layer enforces SUM=100. |
| `006_user_portfolios` | Join: user + portfolio + brokerage_connection + amount_invested + is_syncing |
| `007_rebalance_events` | One row per admin rebalance. Links portfolio + admin. |
| `008_rebalance_event_holdings` | Immutable snapshot of new allocations at rebalance time. |
| `009_pending_rebalances` | Per-user confirmation rows. `pending\|approved\|rejected\|expired`. 72h TTL. |
| `010_trade_history` | Aggregate portfolio-level trade event. `triggered_by`: rebalance/join/leave/admin_remove. |
| `011_user_trade_history` | Per-user trade event. value_before/after. |
| `012_trades` | Individual brokerage orders. ticker, action, quantity, price, status, brokerage_order_id. |
| `013_change_log` | Admin edit audit trail. INSERT-ONLY. `request_id` UUID groups one action. |
| `014_otp_tokens` | 2FA + password reset. bcrypt-hashed, 10-min TTL, single-use. |
| `015_refresh_tokens` | SHA-256 hashed. 30-day TTL. Revocable. |
| `016_error_logs` | Server errors. user_id, endpoint, message, stack_trace, ip_address. |
| `017_login_audit` | Login attempts (`success\|failed`). Admin login calendar. |
| `018_monthly_snapshots` | End-of-month portfolio values per user. |

**Monetary columns**: `DECIMAL(18, 2)` — never `FLOAT`. In Python use `decimal.Decimal`. In Swift use `Decimal` (not `Double`).

---

## Role & Permission Matrix

| Action | user | admin | ultimate_admin |
|---|---|---|---|
| Edit own profile (no role field) | ✓ | ✓ | ✓ |
| Self-delete account | ✓ | ✓ | ✓ |
| Edit user-role accounts | — | ✓ | ✓ |
| DELETE user-role accounts | — | — | ✓ ONLY |
| Edit admin-role accounts | — | — | ✓ |
| DELETE admin-role accounts | — | — | ✓ ONLY |
| Promote / demote roles | — | — | ✓ |
| Toggle subscription_exempt | — | ✓ | ✓ |
| Set must_change_password | — | ✓ | ✓ |
| Create / edit portfolios | — | ✓ | ✓ |
| DELETE portfolios | — | — | ✓ ONLY |
| Rebalance / activate / deactivate | — | ✓ | ✓ |
| Remove user from portfolio | — | ✓ | ✓ |
| View error logs / login analytics | — | ✓ | ✓ |
| View revenue page | — | ✓ | ✓ |
| View change log | — | ✓ | ✓ |

- `assert_can_edit()` and `assert_can_delete()` are enforced at **both** the middleware layer and service layer — two independent checks.
- `sanitize_user()` (via Pydantic `UserResponse`) strips the `role` field before any self-update DB write.
- `subscription_exempt` is never returned in `GET /users/me` or any user-role API response.
- The `change_log` table is **INSERT-ONLY**. No DELETE or UPDATE path exists anywhere in the codebase — not even for `ultimate_admin`.

---

## Subscription Plans — iOS + StoreKit 2

### For iOS App (Required by Apple)

| Plan | Price | StoreKit Product Type | Product ID |
|---|---|---|---|
| Monthly | $15.00/mo | Auto-Renewable Subscription | `com.twintrades.app.monthly` |
| Annual | $150.00/yr | Auto-Renewable Subscription | `com.twintrades.app.annual` |
| Lifetime | $450.00 | Non-Consumable | `com.twintrades.app.lifetime` |

### iOS Purchase Flow

1. `StoreKitService` calls `Product.products(for:)` → shows prices.
2. User taps Subscribe → `product.purchase()`.
3. On success, get the `Transaction` with `jwsRepresentation`.
4. `POST /subscriptions/verify-apple` with the signed JWS.
5. Backend validates signature via **App Store Server Library**, extracts `originalTransactionId`, upserts row in `subscriptions`.
6. Backend subscribes to **App Store Server Notifications V2** (`DID_RENEW`, `EXPIRED`, `REFUND`, etc.) at `POST /webhooks/apple`.

### Apple Server Notifications V2 to Handle

| Notification Type | Action |
|---|---|
| `SUBSCRIBED` (initial) | INSERT subscription row, set `status=active` |
| `DID_RENEW` | Extend `current_period_end` |
| `DID_CHANGE_RENEWAL_STATUS` | Update `cancel_at_period_end` flag |
| `EXPIRED` | Mark `canceled`; `SET is_syncing=FALSE` |
| `REFUND` | Revoke access; `SET is_syncing=FALSE`; log |
| `DID_FAIL_TO_RENEW` | Mark `past_due`; send notification |
| One-time purchase `lifetime` | INSERT row with `current_period_end=NULL` |

### Subscription Exemption

`subscription_exempt=TRUE` bypasses all subscription gates. The `is_subscription_active()` function in `SubscriptionService` checks this first. The `subscription_sync` job skips exempt users entirely.

---

## Rebalance Confirmation Flow

Every user has a `rebalance_confirmation` setting: **manual** (default) or **auto**. This controls whether trades fire immediately on admin rebalance or wait for user confirmation.

### Rebalance Trigger Flow

```
Admin: PATCH /admin/portfolios/{id}/holdings
 ├─ Validate new holdings SUM = 100.00 (else 400)
 ├─ UPDATE portfolio_holdings
 ├─ INSERT rebalance_events              → rebalance_event_id
 ├─ INSERT rebalance_event_holdings      (snapshot of new allocations)
 ├─ INSERT trade_history row
 │
 └─ For each user in user_portfolios WHERE is_syncing = TRUE:
     ├─ rebalance_confirmation = "auto":
     │    INSERT pending_rebalances { status="approved" }
     │    → TradeService.execute_rebalance(...)
     │    → INSERT user_trade_history
     │    → PushService.send(user, "Auto-rebalanced <portfolio>")
     │
     └─ rebalance_confirmation = "manual":
          INSERT pending_rebalances { status="pending", expires_at=+72h }
          → PushService.send(user, "Rebalance requires your approval", deep_link)
          → EmailService.send_rebalance_notification(...)
          → NO trades fire until user confirms
```

### Confirmation Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /portfolios/pending-rebalances` | PROTECTED | Returns all pending rows for current user with old vs new allocation diff |
| `POST /portfolios/{pid}/rebalance/{eid}/confirm` | PROTECTED | Approves and triggers trades. Returns `{ tradesQueued: N }` |
| `POST /portfolios/{pid}/rebalance/{eid}/reject` | PROTECTED | Rejects. No trades fired. User stays at old allocations. |

### iOS Deep Link

Push notification payload includes `deep_link: "twintrades://rebalance/{event_id}"`. `AppDelegate` handles `UIApplication.LaunchOptionsKey.remoteNotification` → routes to `RebalanceConfirmSheet`.

### Expiry Job (APScheduler)

```python
# app/jobs/pending_rebalances.py
# Schedule: every 30 minutes via AsyncIOScheduler — "*/30 * * * *"
async def expire_pending_rebalances():
    async with get_session() as session:
        expired = await RebalanceRepository.find_expired_pending(session)
        for row in expired:
            await RebalanceRepository.set_status(session, row.id, "expired")
            await TradeService.execute_rebalance(
                session,
                user_id=row.user_id,
                portfolio_id=row.portfolio_id,
                event_id=row.event_id,
            )
            logger.info(
                "auto_executed_expired_rebalance",
                user_id=row.user_id,
                portfolio_id=row.portfolio_id,
            )
        await session.commit()
```

---

## Default Admin Seed & Change Log

### Default ultimate_admin Account

- **Default email**: `admin@app.local`
- **Default password**: `Admin@123!`
- `must_change_password = TRUE` — user is redirected to change-password screen before any other action.
- Generate a real bcrypt hash (`rounds=12`) using `passlib` and replace the placeholder in `000_seed_ultimate_admin.py` before running.
- Display these credentials prominently in the project README with a red security warning.
- There is **no** API path to create an ultimate_admin. Only the seed migration can create one.

### Forced Password Change Flow

```python
# app/services/auth_service.py (excerpt)
if user.must_change_password:
    temp_token = Security.sign_jwt(
        claims={"sub": str(user.id), "scope": "change_password_only"},
        expires_in=timedelta(minutes=15),
    )
    return LoginResult(requires_password_change=True, temp_token=temp_token)

# app/middleware/auth_middleware.py (excerpt)
async def get_current_user(...) -> User:
    payload = Security.verify_jwt(token)
    if payload.get("scope") == "change_password_only":
        raise ForbiddenError("Token scope insufficient")
    ...
```

### Change Log System

Every admin-initiated user record change is recorded in `change_log`. The table is **INSERT-ONLY** — no UPDATE or DELETE path exists anywhere. One row per changed field, grouped by `request_id` UUID.

| Field Changed | `field_name` | `old_value` / `new_value` |
|---|---|---|
| email | `email` | Old email → new email |
| username | `username` | Old → new |
| role | `role` | e.g. `"user"` → `"admin"` |
| is_active | `is_active` | `"true"` / `"false"` |
| subscription_exempt | `subscription_exempt` | `"true"` / `"false"` |
| must_change_password | `must_change_password` | `"true"` / `"false"` |
| password (admin reset) | `password` | `NULL → NULL` (never log hashes) |
| rebalance_confirmation | `rebalance_confirmation` | `"manual"` / `"auto"` |

---

## Revenue Page (/admin/revenue)

The revenue page reads entirely from the local `subscriptions` table — no live App Store API calls on page load. Apple Server Notifications V2 keep the table accurate. All revenue figures are computed in the backend service.

| Metric | Calculation |
|---|---|
| MRR from monthly | `COUNT(active monthly subs)` × $15.00 |
| MRR from annual | `COUNT(active annual subs)` × ($150 / 12) = × $12.50 |
| Total MRR | monthly MRR + annual MRR |
| Projected annual | (monthly count × $15 × 12) + (annual count × $150) |
| Lifetime revenue to date | `COUNT(all lifetime subs)` × $450 — shown separately, not in MRR |
| Exempt users | `COUNT(subscription_exempt=TRUE)` — informational only |

The iOS admin area renders a 12-month MRR trend chart using **Swift Charts**, a plan-breakdown table, and stat cards for: Total MRR, Projected Annual, Active Subscribers, Lifetime Revenue. Historical months are read-only; the current month is live.

---

## Security Requirements

| Requirement | Implementation |
|---|---|
| Passwords | `passlib.hash.bcrypt` with `rounds=12`. Store only hash. Compare only via `bcrypt.verify()`. |
| JWT | Access tokens 15-min expiry; refresh tokens 30-day TTL, stored as SHA-256 hash, revocable. |
| Restricted JWTs | `change_password_only` scope rejected on all endpoints except `/auth/change-password`. |
| OTP tokens | 6-digit numeric, bcrypt-hashed, 10-min TTL, single-use. |
| Brokerage tokens | AES-256-GCM with `BROKERAGE_ENCRYPTION_KEY`. Decrypted only inside the adapter layer. |
| iOS token storage | **Keychain Services** only. `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`. Never `UserDefaults`. |
| Biometric unlock | `LocalAuthentication` gates app launch and periodic re-auth. |

| Apple webhooks | Verify JWS signature with Apple's public keys via App Store Server Library. |
| SQL injection | SQLAlchemy parameterized queries only. No f-string or `+` concatenation of user input. ORDER BY on whitelisted columns only. Validate path params via Pydantic `int`. |
| Input validation | Pydantic v2 models on every request body. |
| CORS | Restricted to app origin (admin portal) in production. iOS app does not rely on CORS. |
| TLS | Enforce HTTPS. App Transport Security defaults to HTTPS on iOS. |
| Error responses | Never expose tracebacks. Log to `error_logs`. Return generic message. |
| Sensitive fields | Pydantic `UserResponse` excludes `password_hash`, encrypted tokens, and `subscription_exempt` (for user-role responses). |
| Jailbreak detection | Optional — flag suspicious environments before allowing brokerage linking. |
| Certificate pinning | Optional for `APIClient`; implement via `URLSessionDelegate` for high-risk endpoints. |

### Rate Limiters (`slowapi`)

| Limiter | Window | Max | Applied To |
|---|---|---|---|
| `auth_limiter` | 15 min | 10 per IP | login, register, `/auth/refresh` |
| `otp_limiter` | 10 min | 5 per IP | 2FA verify, OTP requests |
| `password_reset_limiter` | 1 hour | 5 per IP | forgot-password, reset-password |
| `api_limiter` | 1 min | 100 per user ID | All protected user endpoints |
| `admin_limiter` | 1 min | 200 per user ID | All `/admin/*` endpoints |
| `brokerage_auth_limiter` | 1 hour | 10 per user ID | Brokerage OAuth initiation |

---

## iOS Design System (Replaces CSS Architecture)

`Helpers/DesignTokens.swift` is the single source of truth for every color, spacing value, radius, and typography choice. No hardcoded colors, spacing values, or font names anywhere else in the codebase.

```swift
// Helpers/DesignTokens.swift
import SwiftUI

enum DesignTokens {

    enum Colors {
        static let primary      = Color("Primary")       // Asset catalog
        static let accent       = Color("Accent")
        static let accentHover  = Color("AccentHover")
        static let surface      = Color("Surface")
        static let card         = Color("Card")
        static let border       = Color("Border")
        static let textPrimary  = Color("TextPrimary")
        static let textMuted    = Color("TextMuted")
        static let success      = Color.green
        static let danger       = Color.red
        static let warning      = Color.yellow
        static let info         = Color.cyan
    }

    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 40
    }

    enum Radius {
        static let sm: CGFloat = 6
        static let md: CGFloat = 12
        static let lg: CGFloat = 20
    }

    enum Typography {
        static let title    = Font.system(.title,    design: .default,    weight: .bold)
        static let headline = Font.system(.headline, design: .default,    weight: .semibold)
        static let body     = Font.system(.body)
        static let mono     = Font.system(.body,     design: .monospaced)
    }
}
```

**Asset catalog** holds light/dark variants of every color. Views consume `DesignTokens.Colors.accent`, never literal `Color(red:green:blue:)` or `Color(hex:)`. Dark mode is automatic via `@Environment(\.colorScheme)`.

### Correct Usage

```swift
PortfolioCardView(portfolio: p)
    .padding(DesignTokens.Spacing.md)
    .background(DesignTokens.Colors.card)
    .clipShape(RoundedRectangle(cornerRadius: DesignTokens.Radius.md))
    .overlay(
        RoundedRectangle(cornerRadius: DesignTokens.Radius.md)
            .stroke(DesignTokens.Colors.border, lineWidth: 1)
    )
```

**Never**: `.padding(16)` or `.background(Color(red: 0.11, green: 0.17, blue: 0.23))`.

---

## Coding Practices Guide

These standards apply to every file in this project. Read before writing any code.

### 1. Naming Conventions

#### Python

```python
# snake_case for variables, functions, and local scope names
user_id = 42
async def get_portfolio_by_id(portfolio_id: int) -> Portfolio: ...

# PascalCase for classes, Pydantic schemas, enums — AND module file names (mirrors reference project)
class UserService: ...
class UserUpdatePayload(BaseModel): ...
class SubscriptionPlan(str, Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"
    LIFETIME = "lifetime"

# SCREAMING_SNAKE_CASE for module constants
BCRYPT_ROUNDS = 12
DEFAULT_PAGE_LIMIT = 50

# Module file names: PascalCase, singular — matching Kraking reference pattern
# UserService.py, UserDbContext.py, AuthController.py, ErrorHandler.py
# Controllers always named [Domain]Controller.py + [Domain]DbContext.py
```

#### Swift

```swift
// UpperCamelCase for types, protocols, enum cases
struct Portfolio: Codable, Identifiable { ... }
protocol BrokerageAdapter { ... }
enum LoadState { case idle, loading, loaded, error }

// lowerCamelCase for variables, methods, parameters, properties
let userId = 42
func getPortfolio(by id: Int) async throws -> Portfolio

// Files named after the primary type
// DashboardViewModel.swift contains `DashboardViewModel`
```

#### Don't

- Vague names: `data`, `stuff`, `x`, `temp`
- Unnecessary abbreviations: `usr`, `pw`, `prt`
- Mixed casing styles within one language

### 2. Function Size & Single Responsibility

Every function does **one** thing with a name that says exactly what. Controllers / ViewModels orchestrate — they do not implement. Extract helpers when a function exceeds ~40 lines.

```python
# ✅ DO — small, focused
async def hash_password(plaintext: str) -> str:
    return bcrypt.hash(plaintext, rounds=BCRYPT_ROUNDS)

async def validate_login_payload(body: dict) -> LoginPayload:
    return LoginPayload.model_validate(body)

# ❌ DO NOT — mega-function
async def do_login(request):
    email = request.json()["email"]
    rows = await conn.execute(f"SELECT * FROM users WHERE email = '{email}'")  # INJECTION
    if rows[0]["password"] == request.json()["password"]: ...                  # plaintext compare
    token = jwt.encode({"id": rows[0]["id"]}, "secret")                        # hardcoded secret
    print("logged in", email)                                                   # print in prod
```

### 3. Error Handling

#### Python

```python
# app/helper/ErrorHandler.py
class AppError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(message)

class NotFoundError(AppError):
    def __init__(self, msg: str): super().__init__(404, msg)

class ForbiddenError(AppError):
    def __init__(self, msg: str): super().__init__(403, msg)

class UnauthorizedError(AppError):
    def __init__(self, msg: str): super().__init__(401, msg)

# Global handler in Server.py
@app.exception_handler(AppError)
async def app_error_handler(request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})

@app.exception_handler(Exception)
async def unexpected_error_handler(request, exc: Exception):
    await AdminDbContext.insert_error_log(
        user_id=getattr(request.state, "user_id", None),
        endpoint=str(request.url.path),
        message=str(exc),
        stack_trace="".join(traceback.format_exception(exc)),
        ip_address=request.client.host,
    )
    return JSONResponse(status_code=500, content={"error": "Internal server error"})
```

#### Swift

```swift
// Services/Networking/APIError.swift
enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case server(status: Int, data: Data)
    case decoding(Error)
    case unauthorized
    case offline

    var errorDescription: String? {
        switch self {
        case .offline:      return "You appear to be offline."
        case .unauthorized: return "Please sign in again."
        case .server(let status, _): return "Server error (\(status))."
        default:            return "Something went wrong."
        }
    }
}
```

Views receive user-friendly messages from the ViewModel — never raw error objects.

#### Don't

- Swallow errors silently: `try: …  except: pass`
- Send tracebacks to the client: `{"stack": traceback.format_exc()}`
- Use `print()` for error reporting — use `structlog`
- Throw generic errors with no context: `raise Exception("failed")`

### 4. Database Safety

- Always use SQLAlchemy constructs: `select()`, `update()`, `insert()`, bound parameters.
- Raw SQL (`text()`) requires explicit `:param` binding and is forbidden outside DbContext files.
- Dynamic ORDER BY → **whitelist only**, never interpolate user input.
- Path params validated via Pydantic: `user_id: int = Path(..., gt=0)`.
- Multi-step writes wrapped in `async with session.begin():` transactions.
- Escape LIKE wildcards before binding.

```python
# ✅ DO
rows = await session.execute(
    select(User).where(User.email == email)  # bound parameter
)

# ❌ DO NOT
await session.execute(
    text(f"SELECT * FROM users WHERE email = '{email}'")  # SQL INJECTION
)
```

### 5. Authentication & Authorization

- JWT verified **only** inside the FastAPI dependency `get_current_user` — never in controllers or services.
- Role checks enforced at **both** router (`require_role`) **and** service layers (`assert_can_edit`, `assert_can_delete`).
- Password comparison: `bcrypt.verify()` only. Never equality. Never decryption (bcrypt is one-way).
- iOS stores tokens in **Keychain** with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`. Never `UserDefaults`.
- iOS does not decode JWT claims to make security decisions — only for UI hints. Server is the authority.

```python
# ✅ DO — two-layer defense
# Router (middleware)
@router.delete("/{user_id}", dependencies=[Depends(require_role("ultimate_admin"))])

# Service (independent second check)
def assert_can_delete(requester: User, target: User) -> None:
    if requester.role != "ultimate_admin":
        raise ForbiddenError("Insufficient permissions")
```

### 6. Type Safety

#### Python

- Type hints **required** on every function parameter and return value.
- Run `mypy --strict` in CI.
- Avoid `Any`; prefer `TypedDict`, `Literal`, `Annotated`.
- Pydantic models are the source of truth for request/response shapes.

#### Swift

- Enable all SwiftLint / strict concurrency warnings.
- Avoid `Any`/`AnyObject`; prefer generics and protocols.
- Prefer `struct` over `class` unless reference semantics are required.
- Use `Result` or `throws` — never `(data, error)` tuples.
- Never force-unwrap (`!`) except in tests or compile-time-safe contexts.

### 7. Async / Await

#### Python

```python
# ✅ DO — parallel awaits for independent calls
portfolios, subscription = await asyncio.gather(
    PortfolioService.get_user_portfolios(session, user_id),
    SubscriptionService.get_status(session, user_id),
)

# ❌ DO NOT — sequential in a loop
for user_id in user_ids:
    await process_user(user_id)  # N sequential DB calls

# ✅ Better
await asyncio.gather(*[process_user(uid) for uid in user_ids])
```

#### Swift

```swift
// ✅ DO — structured concurrency
async let portfoliosTask = PortfolioService.shared.fetchMyPortfolios()
async let rebalancesTask = PortfolioService.shared.fetchPendingRebalances()
let portfolios = try await portfoliosTask
let rebalances = try await rebalancesTask

// All UI state mutations on @MainActor
@MainActor func updateUI(with items: [Portfolio]) { self.items = items }
```

### 8. Logging

#### Python

```python
# app/core/logger.py — structlog with JSON formatter in production
logger.info("server_started", port=settings.port)
logger.warn("brokerage_token_expiring", user_id=user_id, brokerage="webull")
logger.error("trade_failed", user_id=user_id, ticker=ticker, error=str(err))

# Unexpected errors → DB for admin page
await ErrorLogRepository.insert(user_id=..., endpoint=..., message=..., stack_trace=..., ip_address=...)
```

#### Swift

```swift
// os.Logger with subsystem + category
let logger = Logger(subsystem: "com.twintrades.app", category: "networking")
logger.info("Request started: \(endpoint.path, privacy: .public)")
logger.error("Request failed: \(error.localizedDescription, privacy: .public)")
// User PII defaults to .private
logger.debug("User email: \(email, privacy: .private)")
```

#### Don't

- `print()` / `console.log()` in production code
- Log passwords, tokens, full PII
- Log inside repositories (wrong layer)

### 9. iOS-Specific Hygiene

- **Never** use `WKWebView` for core app screens. This is a native iOS app.
- **Never** ship release builds with `print()` statements — use `os.Logger`.
- **Always** support Dynamic Type — use `.font(.body)`, not fixed point sizes.
- **Always** support Dark Mode — use named colors in Asset catalog.
- **Always** declare required `Info.plist` usage descriptions: `NSFaceIDUsageDescription`, `NSCameraUsageDescription` (portfolio photos), `NSUserTrackingUsageDescription` (if analytics).
- **Always** honor Reduce Motion and VoiceOver — add `.accessibilityLabel` on every interactive element.
- **Touch targets** minimum 44×44 pt (Apple HIG).
- **Safe areas** — use `.safeAreaInset()` / `.ignoresSafeArea()` deliberately; never hardcode insets.
- **Network state** — `NWPathMonitor` to detect offline and surface it in the UI.
- **Decimal** for all money — never `Double`.

### 10. General Project Hygiene

- Keep every file under ~300 lines. If exceeded, split it — the class is doing too much.
- One class / struct / enum per file. `UserService.py` contains only `UserService`.
- All env vars accessed via `Settings` (Pydantic) on backend, `AppConfig` on iOS — never scattered `os.environ[...]` or `ProcessInfo.processInfo.environment[...]`.
- Monetary arithmetic uses `Decimal` (Python) / `Decimal` (Swift). Never float / Double for money.
- Do **not** commit `.env`, `*.xcuserstate`, App Store Connect API keys, APNs `.p8` files — add to `.gitignore` immediately.
- Do **not** cross layer boundaries: services import repositories, not routers. Views import ViewModels, not services directly.
- Do **not** leave `TODO` comments in committed code — resolve or open a tracked issue.
- Do **not** repeat logic — extract to a helper or service if it appears twice.
- Do **not** leave `print()` / `console.log()` debug statements in committed code.

---

## Cron / Scheduled Jobs (APScheduler)

| Job File | Schedule | Logic |
|---|---|---|
| `monthly_reports.py` | `0 8 1 * *` (1st, 08:00 UTC) | Snapshot all user portfolios, compute returns, email monthly reports + iOS push. |
| `portfolio_sync.py` | `0 * * * *` (hourly) | Recalculate return_1d/1w/1m/1y on active portfolios. |
| `subscription_sync.py` | `0 0 * * *` (daily midnight) | Set `is_syncing=FALSE` for expired monthly/annual. Skip lifetime & `subscription_exempt=TRUE`. |
| `snapshot_values.py` | `59 23 * * *` (daily 23:59) | Snapshot portfolio values into `monthly_snapshots` for month-start baseline. |
| `refresh_brokerage_tokens.py` | `0 */6 * * *` (every 6h) | Check `token_expires_at`; call `adapter.refresh_token()` for connections expiring within 1 hour. |
| `pending_rebalances.py` | `*/30 * * * *` (every 30 min) | Find `pending_rebalances WHERE expires_at < NOW()`; set `status=expired`; auto-execute trades. |

APScheduler bootstraps inside FastAPI `lifespan`. For production scale, switch to Celery + Redis with identical job signatures.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET` | 256-bit random string — access tokens |
| `JWT_REFRESH_SECRET` | Separate secret — refresh tokens |
| `BROKERAGE_ENCRYPTION_KEY` | 32-byte hex (64 chars) for AES-256-GCM |
| `APPLE_BUNDLE_ID` | `com.twintrades.app` |
| `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY_PATH` | App Store Server API auth |
| `APPLE_SHARED_SECRET` | Legacy receipt validation (transition only) |
| `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY_PATH`, `APNS_TOPIC` | APNs push auth |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Nodemailer/aiosmtplib SMTP config |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Twilio SMS 2FA |
| `WEBULL_APP_KEY`, `WEBULL_APP_SECRET`, `WEBULL_REDIRECT_URI` | Webull OAuth (primary) |
| `ALPACA_CLIENT_ID`, `ALPACA_CLIENT_SECRET`, `ALPACA_REDIRECT_URI` | Alpaca (Coming Soon stub) |
| `SCHWAB_CLIENT_ID`, `SCHWAB_CLIENT_SECRET`, `SCHWAB_REDIRECT_URI` | Schwab (Coming Soon stub) |
| `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | S3 (or `CLOUDINARY_URL`) |
| `ENV`, `PORT`, `FRONTEND_URL` | App runtime config |

iOS equivalent: `AppConfig.swift` consumes a `.xcconfig` per build scheme (Debug / Staging / Release).

---

## Implementation Order for Agent

### Backend Bootstrap

1. Initialize backend project: `poetry init` → add `fastapi`, `uvicorn[standard]`, `gunicorn`, `sqlalchemy[asyncio]`, `asyncmy`, `alembic`, `pydantic`, `pydantic-settings`, `python-jose[cryptography]`, `passlib[bcrypt]`, `pyotp`, `app-store-server-library`, `aiosmtplib`, `jinja2`, `apscheduler`, `slowapi`, `aioboto3`, `aioapns`, `structlog`, `twilio`.
2. Create all folders per the project structure.
3. Implement `app/core/database.py` (async engine + session factory).
4. Implement `app/core/security.py` (`hash_password`, `verify_password`, `sign_jwt`, `verify_jwt`, `encrypt`, `decrypt`, `generate_otp`).
5. Implement `app/core/errors.py` (custom error classes + global FastAPI handlers).
6. Implement `app/core/config.py` (Pydantic `Settings` class for all env vars).
7. Implement `app/core/logger.py` (`structlog` config).
8. Implement `app/schemas/*.py` Pydantic models for every request/response body.
9. Implement `app/core/migrations.py` (Alembic invocation helpers).

### Database

1. Run `000_seed_ultimate_admin.py` **first** — generate real bcrypt hash of `Admin@123!` and replace placeholder.
2. Run migrations `001` through `018` in order via `alembic upgrade head`.
3. Document default credentials (`admin@app.local` / `Admin@123!`) prominently in README with security warning.

### Backend Core

1. Implement all `app/models/*.py` SQLAlchemy models (PascalCase: `UserModel.py`, `PortfolioModel.py`, etc.).
2. Implement `app/brokerages/Base.py`, `Factory.py`, `webull/Adapter.py` + `webull/Client.py` **fully**. Stub `alpaca/` and `schwab/`.
3. Implement `app/middleware/AuthMiddleware.py` (reject `change_password_only` scope on all regular endpoints).
4. Implement `app/middleware/RoleMiddleware.py` and `RateLimiters.py`.
5. Implement all `app/controllers/[Domain]DbContext.py` files (SQLAlchemy queries, one per domain).
6. Implement all `app/services/[Domain]Service.py` files (call DbContexts, apply business logic).
7. Implement all `app/controllers/[Domain]Controller.py` files (call services, handle HTTP).
8. Implement `app/Routes.py` (register all paths, apply middleware dependencies).
9. Implement `app/integrations/StorekitClient.py`, `ApnsClient.py`, `Mailer.py`.
10. Implement `app/Server.py` (FastAPI factory, global middleware, error handlers, APScheduler lifespan).
11. Implement all `app/jobs/[Job].py` cron tasks.

### iOS Frontend

1. Initialize Xcode project: iOS 16.0+, SwiftUI lifecycle, Swift Package Manager.
2. Set up `Info.plist` usage descriptions, Keychain/Push/Sign-in-with-Apple entitlements.
3. Implement `Helper/DesignTokens.swift` — all colors, spacing, radii, typography.
4. Add Asset catalog color sets (light/dark) for every `DesignTokens.Colors` name.
5. Implement `App/AppConfig.swift` (.xcconfig per scheme: Debug / Staging / Release).
6. Implement `Helper/Formatters.swift`, `Validators.swift`, and `Extensions/`.
7. Implement `Styles/AuthStyle.swift`, `Styles/AdminStyle.swift`, and each `Styles/Overview/*.swift`.
8. Implement `Services/KeychainService.swift`, `BiometricsService.swift`.
9. Implement `Services/Networking/APIClient.swift`, `APIEndpoint.swift`, `APIError.swift`, `RequestInterceptor.swift`.
10. Implement all `Services/Controllers/*.swift` (per-domain networking request builders).
11. Implement `Services/AuthService.swift` (login, refresh, logout, change-password flow).
12. Implement `Services/StoreKitService.swift` (fetch products, purchase, verify with backend).
13. Implement `Services/PushNotificationService.swift` (APNs registration, deep-link handling).
14. Implement all remaining domain services: `PortfolioService`, `BrokerageService`, `TradeService`, `UserService`, `AdminService`, `SubscriptionService`.
15. Implement all `Models/*.swift` Codable structs.
16. Implement `App/AppCoordinator.swift` and `AppDelegate.swift`.
17. Implement all `ViewModels/Overview/*.swift`, `ViewModels/Admin/*.swift`, and top-level auth ViewModels.
18. Implement all `Views/Overview/*.swift`, `Views/Admin/*.swift`, top-level auth Views, and `Views/Components/*.swift`.
19. Wire up `App/TwinTradesApp.swift` with root coordinator, auth gate, deep-link routing.

### Validation (End-to-End Smoke Test)

1. Admin web/iOS login with default credentials → forced password change.
2. Register user on iOS → Sign in with Apple or email/password.
3. Subscribe via StoreKit 2 (all 3 plans) → backend verifies receipt → row in `subscriptions`.
4. Connect Webull via OAuth → brokerage row created (tokens encrypted).
5. Join portfolio → `user_portfolios` row, `is_syncing=TRUE`.
6. Admin rebalance with manual-confirm user → push received → confirm on iOS → trades execute.
7. Admin rebalance with auto user → trades execute immediately → push notification.
8. Verify admin revenue page reflects all purchases (no live App Store API calls).
9. Inspect change log → every admin edit recorded, grouped by `request_id`.
10. `ultimate_admin` deletes a user → rows archived, brokerage revoked.
11. `ultimate_admin` deletes a portfolio → all users removed + positions sold via adapter.

---

## Critical Notes for Agent

### Layer discipline is mandatory

`[Domain]Controller.py` handles HTTP — no SQL. `[Domain]DbContext.py` handles SQL — no HTTP, no logic. Services orchestrate between them. `Routes.py` registers paths only. ViewModels never call `URLSession` directly — they call `Services/Controllers/`. `Styles/` files contain only `ViewModifier` structs — no state, no navigation. Violating these boundaries is the most common source of unmaintainable code.

### This is a native iOS app

Swift + SwiftUI. **Not** React Native, **not** Flutter, **not** a WebView wrapper, **not** a PWA. All UI rendered by the iOS system. Ship via Apple App Store as a real binary.

### iOS optimization

- Minimum iOS 16.0 (required for Swift Charts + `@Observable`).
- Dynamic Type support throughout — use `.font(.body)` not fixed point sizes.
- Dark Mode automatic via Asset catalog.
- Safe areas: `.safeAreaInset()` / `.ignoresSafeArea()` — never hardcode.
- 44×44 pt minimum touch targets (Apple HIG).
- VoiceOver: `.accessibilityLabel` on every interactive element.

### Default credentials

`admin@app.local` / `Admin@123!` — in README with bold red security warning. `must_change_password=TRUE` enforced. No other way to create `ultimate_admin`.

### Webull is primary

First in `BrokerageFactory`. Fully implemented. Alpaca/Schwab are Coming Soon stubs with `is_available=False`.

### Monetary values

`DECIMAL(18, 2)` in DB. `decimal.Decimal` in Python. `Decimal` in Swift. **Never** `float` / `Double`.

### `sanitize_user()` is mandatory

Strip `password_hash`, `subscription_exempt` (for user-role responses), encrypted brokerage tokens before every API response. Enforced via Pydantic `UserResponse`.

### Change log is insert-only

No UPDATE or DELETE on `change_log` anywhere in the codebase — including `ultimate_admin`.

### Revenue page — no live Apple API calls

All data from local `subscriptions` table. Apple Server Notifications V2 keep it accurate.

### IAP compliance

Apple Guideline 3.1.1 — digital subscriptions on iOS **must** use StoreKit 2. All subscription purchases use In-App Purchase via StoreKit 2. Backend validates transactions via the App Store Server Library.

### File length limit

If any file exceeds ~300 lines, split it. Long files signal mixed concerns.

### Design token discipline

Zero hardcoded colors, pixel values, or font names outside `DesignTokens.swift` and the Asset catalog. Every view uses `DesignTokens.*` exclusively.

---

**END OF DOCUMENT**