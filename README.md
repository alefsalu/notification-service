# notification-service

[![CI](https://github.com/alef-salu/notification-service/actions/workflows/ci.yml/badge.svg)](https://github.com/alef-salu/notification-service/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage->=80%25-brightgreen.svg)](https://github.com/alef-salu/notification-service)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-grade, event-driven notification service built with **NestJS 11** and **TypeScript 5**. It ingests notification requests asynchronously via **RabbitMQ**, deduplicates messages idempotently by `eventId`, buffers deliveries in **BullMQ** with exponential backoff and dead-letter isolation, and dispatches across multiple delivery channels (**Email** via SMTP/Mailpit, **Webhooks** with HMAC-SHA256 signatures, and **In-App** real-time alerts via Socket.IO with Redis adapter). State changes and delivery confirmations are recorded atomically using the **Transactional Outbox pattern** with MongoDB multi-document transactions.

---

## Architecture Overview

The system strictly follows **Hexagonal / Clean Architecture** principles, enforcing domain purity with zero framework dependencies:

```mermaid
flowchart TD
    subgraph Ingestion ["Ingestion & Triggering"]
        RABBIT["RabbitMQ<br/>(notifications.events / notifications.requested)"]
        REST["REST API (/api/v1)<br/>(RS256 JWT, RFC 7807)"]
    end

    subgraph Service ["notification-service (NestJS)"]
        DEDUP["Deduplication Store<br/>(ProcessedEvents)"]
        USE_CASES["Application Use Cases<br/>(SendNotification, Preferences, Templates)"]
        DOMAIN["Domain Aggregate & Policies<br/>(Notification, QuietHours, TemplateEngine)"]
        OUTBOX["Transactional Outbox<br/>(MongoDB rs0)"]
        QUEUE["BullMQ Dispatch Queue<br/>(Exponential Backoff & Retries)"]
        GATEWAY["Socket.IO Gateway<br/>(Redis Adapter)"]
    end

    subgraph Storage ["Infrastructure Persistence & Queues"]
        MONGO[("MongoDB 7.0<br/>Replica Set (rs0)")]
        REDIS[("Redis 7<br/>Queues & Pub/Sub")]
    end

    subgraph Channels ["Delivery Channels"]
        SMTP["Email (Mailpit / SMTP)"]
        HOOK["Webhook (HTTP POST + HMAC-SHA256)"]
        SOCKET["In-App (WebSockets / Browser)"]
    end

    RABBIT -->|Consume eventId| DEDUP
    DEDUP -->|Unique| USE_CASES
    REST --> USE_CASES
    USE_CASES --> DOMAIN
    USE_CASES --> QUEUE
    USE_CASES --> OUTBOX
    QUEUE --> REDIS
    OUTBOX --> MONGO
    QUEUE -->|Async Worker| DOMAIN
    DOMAIN --> Channels
    GATEWAY --> REDIS
    Channels --> SMTP
    Channels --> HOOK
    Channels --> SOCKET
```

---

## Key Features

- **Domain-Driven Design Aggregate Lifecycle**: `Notification` transitions through `PENDING` -> `QUEUED` -> `SENT` or `FAILED`.
- **Quiet Hours & Timezone Policy**: Intelligent suppression during overnight hours across timezones using `Intl.DateTimeFormat` (e.g. 22:00 to 07:00 America/Sao_Paulo).
- **Template Engine**: Safe placeholder variable rendering (`{{amount}}`, `{{currency}}`) with strict validation against missing variables.
- **Idempotent RabbitMQ Consumer**: Ingests `notifications.notification.requested.v1` and prevents duplicate processing on at-least-once deliveries.
- **BullMQ Workers & Backoff**: Configured with 3 retry attempts and exponential backoff, isolating failed jobs to dead-letter states with telemetry.
- **WebSocket Gateway**: Clustered Socket.IO with Redis pub/sub adapter, authenticating connections via RS256 JWT handshake.
- **Transactional Outbox**: Atomic recording of notification updates and domain events, relayed every second with publisher confirms to RabbitMQ.
- **Security & RFC 7807**: OWASP security headers, Redis rate limiting (100 req/min), RS256 JWT verification, and standardized problem details (`application/problem+json`).
- **Observability**: Health checks at `/health/live` and `/health/ready`, Prometheus metrics at `/metrics`, and structured JSON logs.

---

## Quickstart

### Prerequisites
- Docker 29 & Docker Compose v5
- Node.js 24 (or Node.js 22 inside Docker)
- OpenSSL (or Docker with `alpine/openssl`)

### 1. Generate Development Keys
Generate the RS256 keypair:
```bash
make keys
```

### 2. Start Infrastructure
Start MongoDB (replica set), Redis, RabbitMQ, and Mailpit:
```bash
make up
```

Service Ports:
- App: `http://localhost:8082`
- MongoDB: `localhost:27018`
- Redis: `localhost:6380`
- RabbitMQ: `localhost:5674` (Management UI: `http://localhost:15674`)
- Mailpit: Web UI `http://localhost:8028` (SMTP: `1028`)

### 3. Generate a Test JWT
Generate a test RS256 JWT token with `USER` and `ADMIN` claims:
```bash
make token
```

### 4. Run Tests
```bash
make test             # Run all tests
make test-unit        # Run unit tests only
make test-integration # Run integration tests
```

---

## REST Endpoints

All endpoints are prefixed with `/api/v1` and protected by RS256 JWT (`Authorization: Bearer <token>`):

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `POST` | `/api/v1/notifications` | Request an asynchronous notification (202 Accepted) | `USER`, `ADMIN` |
| `GET` | `/api/v1/notifications/:id` | Retrieve notification by ID | Owner or `ADMIN` |
| `GET` | `/api/v1/notifications/mine?page=0&size=20` | List user's notifications (paginated) | `USER`, `ADMIN` |
| `POST` | `/api/v1/templates` | Create notification template (201 Created) | `ADMIN` |
| `GET` | `/api/v1/templates/:key` | Get template by key | `USER`, `ADMIN` |
| `PUT` | `/api/v1/templates/:key` | Update template body/subject | `ADMIN` |
| `GET` | `/api/v1/preferences/mine` | Get current user's delivery preferences | `USER`, `ADMIN` |
| `PUT` | `/api/v1/preferences/mine` | Update channels and quiet hours preferences | `USER`, `ADMIN` |
| `GET` | `/health/live` | Process liveness probe | Public |
| `GET` | `/health/ready` | Dependency readiness probe (Mongo, Redis, RabbitMQ) | Public |
| `GET` | `/metrics` | Prometheus metrics endpoint | Public |

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP Server port | `8082` |
| `MONGODB_URI` | MongoDB connection URI with replica set | `mongodb://localhost:27018/notification_db?replicaSet=rs0` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6380` |
| `RABBITMQ_URL` | RabbitMQ AMQP connection string | `amqp://guest:guest@localhost:5674` |
| `SMTP_HOST` | Mailpit / SMTP host | `localhost` |
| `SMTP_PORT` | Mailpit / SMTP port | `1028` |
| `JWT_PUBLIC_KEY_PATH` | Path to RS256 RSA Public Key | `keys/public.pem` |
| `WEBHOOK_SECRET` | HMAC-SHA256 signature secret for webhooks | `dev-webhook-secret` |

---

## Architecture Compliance

This project enforces strict hexagonal boundaries via `dependency-cruiser`.
Run architectural boundary checks with:
```bash
npm run test:arch
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
