import { Socket } from 'socket.io';
import { TokenVerifierPort } from '../../application/ports/token-verifier.port.js';

export function createSocketAuthMiddleware(tokenVerifier: TokenVerifierPort) {
  return async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const authHeader =
        socket.handshake.auth?.token ??
        (socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.substring(7)
          : undefined);

      if (!authHeader) {
        return next(new Error('UNAUTHORIZED: Token required'));
      }

      const payload = await tokenVerifier.verify(authHeader);
      socket.data.user = payload;
      return next();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'UNAUTHORIZED';
      return next(new Error(`UNAUTHORIZED: ${message}`));
    }
  };
}
