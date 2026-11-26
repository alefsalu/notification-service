// tests/unit/security/jwt-token-verifier.spec.ts
import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { JwtTokenVerifier } from '../../../src/infrastructure/security/jwt-token-verifier.js';

describe('JwtTokenVerifier', () => {
  let publicKeyPem: string;
  let privateKeyPem: string;
  let verifier: JwtTokenVerifier;

  beforeAll(() => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
    privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    verifier = new JwtTokenVerifier(publicKeyPem);
  });

  it('validates authentic RS256 token and rejects invalid issuer or expired token', async () => {
    const validToken = jwt.sign(
      { sub: 'user-uuid', email: 'user@test.com', roles: ['USER'] },
      privateKeyPem,
      { algorithm: 'RS256', issuer: 'wallet-api', audience: 'portfolio', expiresIn: '15m', jwtid: 'jti-1' },
    );

    const payload = await verifier.verify(validToken);
    expect(payload.sub).toBe('user-uuid');
    expect(payload.roles).toEqual(['USER']);

    const wrongIssuerToken = jwt.sign(
      { sub: 'user-uuid', email: 'user@test.com', roles: ['USER'] },
      privateKeyPem,
      { algorithm: 'RS256', issuer: 'fake-api', audience: 'portfolio', expiresIn: '15m' },
    );
    await expect(verifier.verify(wrongIssuerToken)).rejects.toThrowError(/Invalid token/);
  });

  it('rejects expired token outside clock tolerance', async () => {
    const expiredToken = jwt.sign(
      { sub: 'user-uuid', email: 'user@test.com', roles: ['USER'] },
      privateKeyPem,
      { algorithm: 'RS256', issuer: 'wallet-api', audience: 'portfolio', expiresIn: -100 },
    );
    await expect(verifier.verify(expiredToken)).rejects.toThrowError(/Invalid token/);
  });
});
