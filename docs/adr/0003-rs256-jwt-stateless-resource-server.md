# ADR 0003: Stateless RS256 JWT Resource Server Verification

## Context and Problem Statement

`notification-service` is an independent resource server that must authenticate incoming REST API requests (`/api/v1/*`) and WebSocket connections (`Socket.IO`). The identity provider of the ecosystem is `wallet-api`. Having `notification-service` perform remote RPC or HTTP calls back to `wallet-api` on every incoming request would create tight coupling, introduce latency, and establish a single point of failure.

## Decision Drivers

- Completely stateless request verification without network roundtrips to `wallet-api`.
- Cryptographic non-repudiation and strict boundary protection.
- Support for token expiration leeway (30s clock skew tolerance).
- Secure role-based access control (`USER` vs `ADMIN`).

## Considered Options

1. **Shared Symmetric Secret (HS256)**: Requires sharing the secret key across all microservices. If any service is compromised, attackers can forge valid tokens for the entire ecosystem.
2. **Synchronous OAuth2 Introspection HTTP Endpoint**: Every request requires an HTTP call to `wallet-api`, introducing severe latency and operational coupling.
3. **Asymmetric RS256 Public Key Verification**: `wallet-api` holds the private key and signs tokens. `notification-service` only holds the public key (`keys/public.pem`), allowing stateless cryptographic verification.

## Decision Outcome

Chosen option: **Option 3 (Asymmetric RS256 Verification)**.

- `notification-service` reads `keys/public.pem` specified by `JWT_PUBLIC_KEY_PATH`.
- Verification validates `algorithm: RS256`, `issuer: 'wallet-api'`, and `audience: 'portfolio'` with 30s clock tolerance.
- NestJS `JwtAuthGuard` and `RolesGuard` extract claims (`sub`, `roles`) directly from the validated token payload.

### Consequences

- **Good**: Zero latency overhead and zero dependency on `wallet-api` uptime.
- **Good**: Maximum security; `notification-service` cannot forge tokens even if its container is compromised.
- **Bad**: Key rotation requires deploying or fetching updated public keys (e.g. via JWKS endpoint).
