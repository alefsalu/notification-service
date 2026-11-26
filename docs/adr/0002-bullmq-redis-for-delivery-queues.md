# ADR 0002: BullMQ and Redis for Asynchronous Delivery Queues

## Context and Problem Statement

Dispatched notifications must interact with external I/O boundaries (SMTP servers, remote webhook endpoints, and WebSocket connections) that exhibit unpredictable latencies, rate limits, and intermittent network failures. Direct synchronous dispatch in HTTP request or RabbitMQ consumer threads risks connection starvation, thread pool exhaustion, and cascading timeouts.

## Decision Drivers

- Asynchronous decoupling between notification ingestion and channel delivery.
- Sophisticated retry policies with exponential backoff and jitter.
- Isolation of permanently failing jobs to dead-letter storage.
- Rate-limiting capabilities per channel or recipient domain.

## Considered Options

1. **Direct RabbitMQ Queues with Dead Letter Exchanges (DLX)**: RabbitMQ natively supports DLX and message TTL, but setting up complex exponential backoff requires tricky dead-letter hops or delayed message exchange plugins.
2. **BullMQ backed by Redis**: Built specifically for Node.js / TypeScript, offering first-class exponential backoff (`backoff: { type: 'exponential', delay: 1000 }`), configurable retry limits, concurrency control, job progress events, and dead-letter inspection.
3. **In-Memory JavaScript Timers / Event Emitter**: Fails on process restarts; zero fault tolerance.

## Decision Outcome

Chosen option: **Option 2 (BullMQ backed by Redis)**.

- RabbitMQ is used for inter-service choreography (`notifications.requested` and `notifications.events`).
- BullMQ is used as the internal dispatch and retry engine (`notification-dispatch` queue).
- Workers handle up to 3 retry attempts with exponential backoff.
- On terminal failure, the worker marks the aggregate as `FAILED` and records `notifications.notification.failed.v1` in the outbox.

### Consequences

- **Good**: Clean separation between macro-architecture messaging (RabbitMQ) and micro-dispatch queue execution (BullMQ).
- **Good**: Built-in exponential backoff without custom queue routing gymnastics.
- **Bad**: Requires running Redis alongside RabbitMQ.
