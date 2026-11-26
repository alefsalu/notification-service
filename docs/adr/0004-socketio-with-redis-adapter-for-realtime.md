# ADR 0004: Socket.IO with Redis Adapter for Clustered Real-Time In-App Alerts

## Context and Problem Statement

For in-app notifications, users connected via web browsers or mobile applications must receive real-time alerts immediately when events occur (e.g. money transferred, order matched). In production environments, `notification-service` is scaled horizontally across multiple instances or pods. If a user is connected via WebSocket to Instance A, but the BullMQ delivery worker or RabbitMQ consumer runs on Instance B, Instance B must be able to deliver the alert to the user on Instance A without point-to-point routing logic.

## Decision Drivers

- Transparent horizontal scaling across multiple instances.
- Simple room-based routing (`user:${userId}`).
- Automatic reconnection and fallback handling.
- Unified RS256 authentication on socket handshake.

## Considered Options

1. **Standard In-Memory Socket.IO**: Works only on a single instance; multi-instance deployment drops notifications when the user is connected to a different container.
2. **Raw WebSockets (`ws`) with Custom Redis Pub/Sub**: Requires writing custom reconnection, ping/pong heartbeats, protocol framing, and room management logic.
3. **Socket.IO with `@socket.io/redis-adapter`**: Industry-standard solution providing automatic room broadcasting across Redis pub/sub channels without changing application code.

## Decision Outcome

Chosen option: **Option 3 (Socket.IO with Redis Adapter)**.

- When a client connects and authenticates, it automatically joins room `user:${userId}`.
- Dispatches execute `server.to('user:' + userId).emit('notification', payload)`.
- The Redis adapter automatically publishes the message across Redis channels so any connected instance holding the user's socket delivers the packet.

### Consequences

- **Good**: Seamless multi-node scalability out of the box.
- **Good**: Zero custom pub/sub protocol maintenance.
- **Bad**: Requires Redis connectivity for WebSocket pub/sub broadcasting.
