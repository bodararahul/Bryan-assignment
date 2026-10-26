import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/token';

// Extend Express Request to include authenticated user and tenantId
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      tenantId?: string;
    }
  }
}

/**
 * Enterprise Authentication & Customer Isolation Guard Middleware
 *
 * Supports two authentication schemes:
 * 1. Bearer Token (JWT / HMAC): via Authorization: Bearer <token>
 *    Used by the frontend login session. Validates signature, expiry, and
 *    extracts the organization's tenant_id for customer data isolation.
 * 2. API Key: via X-API-Key: <key>
 *    Used for automated integration tests and machine-to-machine calls.
 *    Supports optional X-Tenant-ID header.
 *
 * Any request to protected routes without a valid Bearer token or matching
 * API key receives an HTTP 401 Unauthorized response.
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Check Bearer Token (primary web UI authentication)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
      req.tenantId = payload.tenantId || 'tenant_default';
      return next();
    }
    res.status(401).json({
      error: 'Unauthorized',
      message: 'The session token is invalid or has expired. Please log in again.',
    });
    return;
  }

  // 2. Check X-API-Key Header (server-to-server or test suite authentication)
  const configuredApiKey = process.env.API_KEY;
  const providedApiKey = req.headers['x-api-key'];

  if (configuredApiKey && providedApiKey) {
    if (providedApiKey === configuredApiKey) {
      req.tenantId = (req.headers['x-tenant-id'] as string) || 'tenant_default';
      return next();
    }
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key provided.',
    });
    return;
  }

  // 3. Reject all unauthenticated requests
  res.status(401).json({
    error: 'Unauthorized',
    message:
      'Authentication required. Please log in or provide a valid Bearer token in the Authorization header.',
  });
};
