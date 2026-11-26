# Notification Service Architecture

This document details the software architecture of `notification-service` using the C4 model.

## 1. C4 Context Diagram

The Context diagram illustrates how `notification-service` fits into the broader portfolio ecosystem, interacting with core services, users, and external messaging providers.

```mermaid
C4Context
    title System Context diagram for Notification Service

    Person(user, "User / Customer", "End user receiving banking, order, and account notifications.")

    System(walletApi, "Wallet API", "Handles accounts, deposits, transfers, and issues RS256 JWT tokens.")
    System(ordersService, "Orders Service", "Handles order matching and trade executions.")
    System_Boundary(notifBoundary, "Notification Service Boundary")
        System(notificationService, "Notification Service", "Provides templated multi-channel notification deliveries.")
    System_End()

    System_Ext(mailpit, "SMTP Provider (Mailpit / SES)", "Delivers transactional emails to users.")
    System_Ext(webhookReceiver, "Client Webhook Endpoint", "Consumes signed HTTP POST webhooks.")

    Rel(user, notificationService, "Reads notifications and receives realtime alerts", "HTTPS / WSS")
    Rel(walletApi, notificationService, "Emits domain events via RabbitMQ", "AMQP (wallet.events)")
    Rel(ordersService, notificationService, "Emits order events via RabbitMQ", "AMQP (orders.events)")
    Rel(notificationService, mailpit, "Sends emails", "SMTP (Port 1025)")
    Rel(notificationService, webhookReceiver, "Dispatches signed POST events", "HTTPS + HMAC-SHA256")
```

---

## 2. C4 Container Diagram

The Container diagram details the internal services, queues, and databases powering `notification-service`:

```mermaid
C4Container
    title Container diagram for Notification Service

    Person(user, "User / Client App", "Receives notifications.")

    Container_Boundary(c1, "notification-service")
        Container(api, "REST Presentation & Gateway", "NestJS, TypeScript", "Serves REST endpoints under /api/v1 and Socket.IO WebSocket connections.")
        Container(useCases, "Application Layer", "TypeScript", "Executes SendNotification, ManagePreferences, and ManageTemplate use cases.")
        Container(domain, "Domain Model", "TypeScript", "Notification Aggregate, UserPreferencesPolicy, TemplateEngine.")
        Container(worker, "BullMQ Delivery Worker", "Node.js, BullMQ", "Processes queued deliveries with exponential backoff and dead-letter isolation.")
        Container(outboxRelay, "Transactional Outbox Relay", "TypeScript", "Polls unpublished events and emits with publisher confirms to RabbitMQ.")
        Container(consumer, "RabbitMQ Consumer", "amqplib", "Consumes notifications.requested with deduplication by eventId.")
    Container_Boundary_End()

    ContainerDb(mongo, "MongoDB Database", "MongoDB 7.0 Replica Set (rs0)", "Stores notifications, templates, user preferences, processed events, and outbox.")
    ContainerDb(redis, "Redis Instance", "Redis 7.0", "Provides BullMQ queue storage, rate limiting sliding windows, and Socket.IO pub/sub adapter.")
    Container(rabbitmq, "RabbitMQ Message Broker", "RabbitMQ 4", "Topic exchange notifications.events and queue notifications.requested.")
    Container(mailpit, "Mailpit Server", "Mailpit (Docker)", "Captures transactional emails sent via SMTP.")

    Rel(user, api, "Connects and queries notifications", "JSON / HTTPS, WSS")
    Rel(api, useCases, "Invokes use cases")
    Rel(consumer, useCases, "Invokes SendNotification")
    Rel(useCases, domain, "Executes domain logic")
    Rel(useCases, mongo, "Saves aggregate and outbox entry atomically", "MongoDB Session (ACID)")
    Rel(useCases, redis, "Enqueues notification job", "BullMQ")
    Rel(worker, redis, "Pulls jobs and updates job state", "BullMQ")
    Rel(worker, mongo, "Updates notification status to SENT or FAILED")
    Rel(outboxRelay, mongo, "Queries and updates outbox table", "Mongoose")
    Rel(outboxRelay, rabbitmq, "Publishes events with confirms", "AMQP topic")
    Rel(worker, mailpit, "Sends email", "SMTP")
```

---

## 3. Hexagonal Architecture Layers

The service enforces strict decoupling between layers:

- **Domain Layer (`src/domain`)**:
  - Contains entities (`Notification`, `Template`, `UserPreferences`), value objects (`NotificationId`, `UserId`, `Recipient`, `QuietHours`), domain events, and pure domain services (`TemplateEngine`, `UserPreferencesPolicy`).
  - Completely pure: zero framework dependencies, zero imports from `@nestjs`, `mongoose`, `ioredis`, or `amqplib`.
- **Application Layer (`src/application`)**:
  - Defines ports (interfaces) for repositories, queues, publishers, broadcasters, and token verifiers.
  - Implements use cases: `SendNotificationUseCase`, `GetNotificationUseCase`, `ListUserNotificationsUseCase`, `ManageTemplateUseCase`, `ManagePreferencesUseCase`.
  - Has zero knowledge of infrastructure specifics (no direct Mongoose models or Redis connections).
- **Infrastructure Layer (`src/infrastructure`)**:
  - Implements ports defined in the application layer:
    - MongoDB repositories with Mongoose schemas and mappers.
    - Redis adapters for BullMQ queues and Socket.IO pub/sub.
    - AMQP publisher and consumer with event deduplication.
    - Channel delivery strategies: `EmailChannelStrategy`, `WebhookChannelStrategy`, `InAppChannelStrategy`.
    - RS256 `JwtTokenVerifier` and NestJS authentication guards.
    - Observability: Prometheus metrics, health probes, and structured Pino JSON logger.
- **Presentation Layer (`src/presentation`)**:
  - NestJS REST controllers exposing routes under `/api/v1`.
  - RFC 7807 global exception filter returning `application/problem+json`.
  - Middlewares for `X-Correlation-Id` tracking and OWASP security headers.
  - Rate limiting guard using Redis.
