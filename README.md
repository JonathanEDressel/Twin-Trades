# TwinTrades

TwinTrades is a **copy-trading mobile app** that lets users follow and automatically mirror the trades of other investors. Users connect their brokerage accounts (Webull, Alpaca, Schwab), subscribe to traders they want to copy, and the platform handles portfolio rebalancing automatically.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native (Expo) with expo-router |
| Backend API | Python 3.11+, FastAPI, uvicorn |
| Database | MySQL via SQLAlchemy (async) + Alembic |
| Auth | JWT access/refresh tokens, TOTP & SMS 2FA |
| Brokerages | Webull, Alpaca, Schwab |
| Push Notifications | Apple APNs |
| In-App Purchases | Apple StoreKit / expo-in-app-purchases |
| Email | SMTP (aiosmtplib) |
| SMS | Twilio |
| File Storage | AWS S3 |
| Background Jobs | APScheduler |

---

## Project Structure

```
Twin-Trades/
├── backend/       # FastAPI Python backend
└── frontend/      # React Native / Expo mobile app
```

---

## Backend

### Prerequisites

- Python 3.11+
- [Poetry](https://python-poetry.org/docs/#installation)
- MySQL database

### Setup

1. **Install dependencies**
   ```bash
   cd backend
   poetry install
   ```

2. **Configure environment** — create a `.env` file in `backend/`:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=twintrades

   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret

   # Brokerage token encryption
   BROKERAGE_ENCRYPTION_KEY=your_32_byte_fernet_key

   # Apple / StoreKit
   APPLE_BUNDLE_ID=com.twintrades.app
   APPLE_ISSUER_ID=
   APPLE_KEY_ID=
   APPLE_PRIVATE_KEY_PATH=secrets/apple_private_key.p8
   APPLE_SHARED_SECRET=

   # APNs (push notifications)
   APNS_KEY_ID=
   APNS_TEAM_ID=
   APNS_PRIVATE_KEY_PATH=secrets/apns_private_key.p8
   APNS_TOPIC=com.twintrades.app

   # Email (SMTP)
   SMTP_HOST=
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASS=
   EMAIL_FROM=noreply@twintrades.com

   # Twilio (SMS 2FA)
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   TWILIO_FROM_NUMBER=

   # Webull OAuth
   WEBULL_APP_KEY=
   WEBULL_APP_SECRET=
   WEBULL_REDIRECT_URI=

   # Alpaca OAuth
   ALPACA_CLIENT_ID=
   ALPACA_CLIENT_SECRET=
   ALPACA_REDIRECT_URI=

   # Schwab OAuth
   SCHWAB_CLIENT_ID=
   SCHWAB_CLIENT_SECRET=
   SCHWAB_REDIRECT_URI=

   # AWS S3
   S3_BUCKET=
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_REGION=us-east-1

   # App runtime
   ENV=development
   PORT=8000
   FRONTEND_URL=
   ```

3. **Run database migrations**
   ```bash
   poetry run alembic upgrade head
   ```

4. **Start the server**
   ```bash
   poetry run uvicorn app.Server:app --reload
   ```

   The API will be available at `http://localhost:8000`.  
   Interactive docs (Swagger UI) are at `http://localhost:8000/docs` (development only).

### Running Tests

```bash
cd backend
poetry run pytest
```

### Background Jobs

The following jobs run automatically when the server starts:

| Job | Schedule |
|-----|----------|
| Expire pending rebalances | Every 30 minutes |
| Sync portfolio returns | Every hour |
| Sync subscriptions | Daily at midnight |
| Snapshot portfolio values | Daily at 23:59 |
| Refresh brokerage tokens | Every 6 hours |
| Send monthly reports | 1st of each month at 08:00 |

---

## Frontend

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator, or the Expo Go app on a physical device

### Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment** — create a `.env` file in `frontend/`:
   ```env
   EXPO_PUBLIC_API_URL=http://<your-local-ip>:8000
   ```
   Use your machine's local network IP (not `localhost`) so a physical device or emulator can reach the backend.

3. **Start the Expo dev server**
   ```bash
   npm start
   ```

   Then press:
   - `i` — open iOS Simulator
   - `a` — open Android Emulator
   - `w` — open in browser
   - Scan the QR code with the **Expo Go** app on a physical device

### Platform-specific

```bash
npm run ios       # iOS Simulator
npm run android   # Android Emulator
npm run web       # Web browser
```

---

## API Overview

| Prefix | Description |
|--------|-------------|
| `/auth` | Registration, login, token refresh, 2FA |
| `/users` | User profile management |
| `/admin` | Admin-only management endpoints |
| `/portfolios` | Portfolio CRUD and performance data |
| `/rebalances` | Rebalance event tracking |
| `/subscriptions` | Copy-trading subscriptions |
| `/brokerages` | OAuth connect/disconnect brokerage accounts |
| `/trades` | Trade history |
| `/webhooks` | Incoming brokerage/StoreKit webhooks |
