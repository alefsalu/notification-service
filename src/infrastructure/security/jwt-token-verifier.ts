import fs from 'node:fs';
import jwt from 'jsonwebtoken';
import { TokenVerifierPort, JwtPayload } from '../../application/ports/token-verifier.port.js';

export class JwtTokenVerifier implements TokenVerifierPort {
  private readonly publicKey: string;

  constructor(publicKeyOrPath?: string) {
    const keyInput = publicKeyOrPath ?? process.env.JWT_PUBLIC_KEY_PATH ?? '';
    if (keyInput.includes('-----BEGIN PUBLIC KEY-----')) {
      this.publicKey = keyInput;
    } else if (keyInput && fs.existsSync(keyInput)) {
      this.publicKey = fs.readFileSync(keyInput, 'utf-8');
    } else {
      this.publicKey = keyInput;
    }
  }

  async verify(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'wallet-api',
        audience: 'portfolio',
        clockTolerance: 30,
      }) as unknown as JwtPayload;

      return decoded;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Token verification failed';
      throw new Error(`Invalid token: ${message}`);
    }
  }
}
