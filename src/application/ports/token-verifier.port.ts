export type UserRole = 'USER' | 'ADMIN';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  iss: 'wallet-api';
  aud: 'portfolio';
  exp: number;
  iat?: number;
  jti?: string;
}

export interface TokenVerifierPort {
  verify(token: string): Promise<JwtPayload>;
}

export const TokenVerifierPort = Symbol('TokenVerifierPort');
