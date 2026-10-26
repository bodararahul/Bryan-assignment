import crypto from 'crypto';

export interface TokenUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  orgName: string;
}

export interface TokenPayload extends TokenUser {
  exp: number; // Expiration timestamp in ms
  iat: number; // Issued at timestamp in ms
}

// Secret key for HMAC-SHA256 signature
const getSecret = (): string => {
  return (
    process.env.JWT_SECRET ||
    process.env.API_KEY ||
    'leadmanager-enterprise-secure-jwt-hmac-secret-key-2025'
  );
};

/**
 * Signs a payload into a secure HMAC-SHA256 Bearer token.
 * Token format: <base64url(payload)>.<base64url(signature)>
 * Default expiration: 24 hours.
 */
export const signToken = (user: TokenUser, expiresInHours = 24): string => {
  const now = Date.now();
  const payload: TokenPayload = {
    ...user,
    iat: now,
    exp: now + expiresInHours * 60 * 60 * 1000,
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payloadEncoded)
    .digest('base64url');

  return `${payloadEncoded}.${signature}`;
};

/**
 * Verifies a token and returns the decoded payload if valid and not expired.
 * Returns null if invalid, tampered, or expired.
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 2) return null;

    const [payloadEncoded, signature] = parts;
    if (!payloadEncoded || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', getSecret())
      .update(payloadEncoded)
      .digest('base64url');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    // Timing-safe comparison to prevent timing attacks
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payloadJson = Buffer.from(payloadEncoded, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as TokenPayload;

    // Check expiration
    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};
