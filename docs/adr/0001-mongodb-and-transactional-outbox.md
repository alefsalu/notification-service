# ADR 0001: MongoDB Document Model and Transactional Outbox Pattern

## Context and Problem Statement

`notification-service` handles diverse notification channels (Email, Webhook, In-App), each requiring polymorphic payload structures (e.g., email subjects and HTML bodies, arbitrary webhook JSON payloads, custom in-app action buttons). Furthermore, when notifications are requested or their status transitions (PENDING -> QUEUED -> SENT / FAILED), downstream systems must be notified reliably without data inconsistency or dual-write anomalies between database updates and message broker emissions.

## Decision Drivers

- Need for schema flexibility with polymorphic notification payloads and template data.
- Strict consistency between aggregate state persistence and domain event emission.
- Avoidance of distributed two-phase commit (2PC) or dual-write vulnerability.
- High write throughput for event ingestion.

## Considered Options

1. **PostgreSQL with JSONB and Outbox Table**: Solid ACID compliance, but schema migrations for template variations require JSONB queries without native document mapping.
2. **MongoDB Replica Set with Multi-Document ACID Transactions**: Provides document flexibility for dynamic payloads while enabling ACID transactions across `notifications` and `outbox` collections via single-node replica set (`rs0`).
3. **Direct RabbitMQ Publish on HTTP/Consumer handler**: Prone to dual-write failures where database write succeeds but broker publish fails, causing phantom state.

## Decision Outcome

Chosen option: **Option 2 (MongoDB Replica Set with Multi-Document Transactions and Transactional Outbox)**.

- Notification aggregate state and outbox events are committed inside a single MongoDB `ClientSession` transaction.
- An asynchronous `OutboxRelayService` polls unpublished entries and publishes them to RabbitMQ with publisher confirms.
- If RabbitMQ is down, events remain safely stored in the `outbox` collection until the broker recovers.

### Consequences

- **Good**: Zero risk of message loss or phantom publishes (guaranteed At-Least-Once delivery).
- **Good**: Document model accommodates arbitrary template data structures effortlessly.
- **Bad**: Requires MongoDB to run with a replica set (`--replSet rs0`) even in local Docker development to enable multi-document transactions.
