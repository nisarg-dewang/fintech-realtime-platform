# FinTech Realtime Platform

A production-style demo of a **real-time trading backend** with **NestJS, Redis, WebSockets, and event-driven design**, plus a minimal **React** frontend.

---

## Architecture

```
                    +----------------------+
                    |  Market Data Service |
                    | (price generator 1s)|
                    +----------+----------+
                               |
                         write + publish
                               |
              +----------------+----------------+
              |                                 |
        Redis Cache                      Redis Pub/Sub
     (market:price:SYMBOL)              MARKET_UPDATE
              |                         TRADE_EXECUTED
              |                                 |
    GET /api/market/:symbol                     |
              |                                 v
              |                    +------------------------+
              |                    |   WebSocket Gateway    |
              |                    |   (Socket.IO /ws)      |
              |                    +------------+-----------+
              |                                 |
              |                          market_update
              |                          trade_executed
              |                                 |
              v                                 v
     REST API (Swagger)                  Connected clients
     /api/auth, /api/portfolio
```

- **Market service**: Simulates prices for AAPL, TSLA, BTC, ETH every second; writes to Redis and publishes `MARKET_UPDATE`.
- **Portfolio service**: Buy/sell uses current price from Redis; publishes `TRADE_EXECUTED` on each trade.
- **Redis**: Cache for latest prices; Pub/Sub for `MARKET_UPDATE` and `TRADE_EXECUTED`.
- **WebSocket gateway**: Subscribes to Redis channels and broadcasts `market_update` and `trade_executed` to all connected clients.
- **Frontend**: Login/Register, Dashboard (live prices + WS status), Portfolio (balance, positions, buy/sell).

---

## Tech Stack

| Layer    | Stack |
|----------|--------|
| Backend  | Node.js, NestJS, TypeScript, Redis, PostgreSQL, WebSockets (Socket.IO), Swagger |
| Frontend | React, Vite, TypeScript, simple CSS |
| Infra   | Docker, docker-compose |

---

## How to Run

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for backend stack)
- Or: local PostgreSQL and Redis

### Option A: Backend with Docker (recommended)

```bash
# Start Postgres + Redis + Backend
docker compose up -d

# Backend: http://localhost:3000
# Swagger:  http://localhost:3000/api/docs
```

Then run the frontend locally (so it can proxy to the backend):

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### Option B: Backend only (Postgres + Redis already running)

```bash
# Start Postgres and Redis (e.g. docker compose up -d postgres redis)
cd backend
npm install
npm run start:dev
```

Environment (optional): `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET`, `PORT`.

### Option C: Local dev (no Docker)

Run Postgres and Redis locally, then:

```bash
# Terminal 1 – backend
cd backend && npm install && npm run start:dev

# Terminal 2 – frontend
cd frontend && npm install && npm run dev
```

---

## WebSocket Demo

1. Open the app at `http://localhost:5173` and log in (or register).
2. Go to **Dashboard**. You should see:
   - **WebSocket: Connected** (green) when the Socket.IO client is connected.
   - Live prices for AAPL, TSLA, BTC, ETH updating about every second.
3. Go to **Portfolio** and **Buy** an asset; the list and balance update. Other open tabs/clients receive `trade_executed` (and can refresh portfolio to see updates).

**Events from server:**

| Event            | Payload |
|------------------|--------|
| `market_update`  | `{ prices: [{ symbol, price }], timestamp }` |
| `trade_executed` | `{ userId, type: 'buy'\|'sell', symbol, quantity, price, timestamp }` |

**Connect manually (e.g. browser console):**

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', { path: '/ws' });
socket.on('connect', () => console.log('connected'));
socket.on('market_update', (d) => console.log('prices', d.prices));
socket.on('trade_executed', (d) => console.log('trade', d));
```

---

## Example API Calls

Base URL: `http://localhost:3000/api` (or same origin if behind a proxy).

### Auth

```bash
# Register
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}' | jq

# Login
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}' | jq
```

Save `access_token` from the response for the next calls.

### Portfolio

```bash
export TOKEN="<access_token>"

# Get portfolio
curl -s http://localhost:3000/api/portfolio -H "Authorization: Bearer $TOKEN" | jq

# Buy 10 AAPL
curl -s -X POST http://localhost:3000/api/portfolio/buy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","quantity":10}' | jq

# Sell 5 AAPL
curl -s -X POST http://localhost:3000/api/portfolio/sell \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","quantity":5}' | jq
```

### Market (Redis-backed)

```bash
curl -s http://localhost:3000/api/market/AAPL | jq
curl -s http://localhost:3000/api/market/BTC  | jq
```

---

## Project Structure

```
backend/
  src/
    modules/
      auth/          # register, login, JWT
      users/         # user entity, me
      portfolio/     # balance, positions, buy, sell
      market/        # price simulation, Redis cache
    gateways/
      market.gateway # WebSocket, Redis Pub/Sub → clients
    redis/           # Redis client + Pub/Sub
    common/
    config/
frontend/
  src/
    pages/           # Login, Dashboard, Portfolio
    hooks/           # useAuth, useSocket
    api/             # REST client
    components/      # Layout
docker-compose.yml   # app, redis, postgres
```

---

## License

MIT.
