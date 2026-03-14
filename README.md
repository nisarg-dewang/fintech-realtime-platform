# FinTech Realtime Platform

A production-style demo of a **real-time trading backend architecture** built with **NestJS, Redis, WebSockets, and event-driven design**.

This project simulates the core backend components of a modern fintech trading platform (similar in architecture to systems behind apps like Robinhood), including:

* Real-time market data streaming
* Portfolio management
* Event-driven trade processing
* Redis caching for low-latency reads
* WebSocket broadcasting for live updates
* API-first development with Swagger
* Minimal React dashboard for visualization

The goal of this project is to demonstrate **backend architecture patterns used in scalable fintech systems**.

---

# Architecture Overview

The platform follows a **modular, event-driven backend architecture** designed for low-latency data flows and horizontal scalability.

```
                +---------------------+
                | Market Data Service |
                |  (price generator)  |
                +----------+----------+
                           |
                     publish updates
                           |
                     Redis Pub/Sub
                           |
        +------------------+------------------+
        |                                     |
+---------------+                    +---------------+
| WebSocket App |                    | WebSocket App |
| Instance #1   |                    | Instance #2   |
+-------+-------+                    +-------+-------+
        |                                    |
        |                                    |
     WebSocket                            WebSocket
        |                                    |
      Users                                Users
```

Key architectural concepts demonstrated:

* Event-driven systems
* Real-time WebSocket streaming
* Redis-based distributed messaging
* Scalable service boundaries
* API-first backend design

---

# Tech Stack

## Backend

* Node.js
* NestJS
* TypeScript
* Redis (Caching + Pub/Sub)
* PostgreSQL / SQLite
* WebSockets (Socket.IO via NestJS Gateway)
* Swagger / OpenAPI
* Docker

## Fro
