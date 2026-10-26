import { Router, Request, Response } from 'express';
import { signToken, verifyToken, TokenUser } from '../utils/token';
import { verifyPassword } from '../utils/password';
import { validateEmail, validatePasswordStrength } from '../utils/validators';
import {
  findUserByEmail,
  createUser,
  seedStarterLeads,
} from '../models/userModel';

const router = Router();

// Configured admin credentials with safe defaults
const getAdminCredentials = () => {
  return {
    email: (process.env.ADMIN_EMAIL || 'admin@leadmanager.com').toLowerCase().trim(),
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    name: process.env.ADMIN_NAME || 'LeadManager Admin',
    orgName: 'LeadManager Enterprise',
    tenantId: 'tenant_default',
  };
};

/**
 * POST /api/auth/register
 * Creates a new user account with an isolated tenant organization,
 * seeds starter leads, and returns a signed 24h Bearer token.
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, orgName, email, password, confirmPassword } = req.body || {};

    if (!name || !email || !password) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Name, email, and password are required fields.',
      });
      return;
    }

    const trimmedName = String(name).trim();
    if (trimmedName.length < 2) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Full Name must be at least 2 characters long.',
      });
      return;
    }

    const trimmedEmail = String(email).toLowerCase().trim();
    if (!validateEmail(trimmedEmail)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Please provide a valid email address.',
      });
      return;
    }

    // Verify confirm password match if provided
    if (confirmPassword !== undefined && String(password) !== String(confirmPassword)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Password and Confirm Password do not match.',
      });
      return;
    }

    // Validate password complexity: min 8, 1 uppercase, 1 lowercase, 1 number, 1 symbol
    const passCheck = validatePasswordStrength(String(password));
    if (!passCheck.isValid) {
      res.status(400).json({
        error: 'Validation failed',
        message: passCheck.errors[0] || 'Password does not meet complexity requirements.',
        details: passCheck.errors,
      });
      return;
    }

    // Check if user already exists
    const existing = await findUserByEmail(trimmedEmail);
    if (existing) {
      res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists. Please log in.',
      });
      return;
    }

    const organization = (orgName && String(orgName).trim()) || `${name.trim()}'s Team`;

    // Create user with isolated tenant_id
    const newUser = await createUser({
      name: String(name).trim(),
      orgName: organization,
      email: trimmedEmail,
      password: String(password),
      role: 'admin',
    });

    // Seed starter leads for this tenant
    try {
      await seedStarterLeads(newUser.tenant_id, newUser.org_name);
    } catch (seedErr) {
      console.warn('Starter leads seed notice:', seedErr);
    }

    const tokenUser: TokenUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      tenantId: newUser.tenant_id,
      orgName: newUser.org_name,
    };

    const token = signToken(tokenUser, 24);

    res.status(201).json({
      success: true,
      message: 'Workspace and account created successfully',
      token,
      user: tokenUser,
    });
  } catch (err: unknown) {
    const e = err as Error;
    console.error('Registration error:', e);
    res.status(500).json({
      error: 'Registration failed',
      message: e.message || 'An error occurred during account creation.',
    });
  }
});

/**
 * POST /api/auth/login
 * Validates credentials against DB or fallback admin and returns Bearer token.
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Both email and password are required.',
      });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (!validateEmail(normalizedEmail)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Please provide a valid email address.',
      });
      return;
    }
    const plainPassword = String(password);

    // 1. Look up user in database
    const dbUser = await findUserByEmail(normalizedEmail);
    if (dbUser) {
      const isMatch = verifyPassword(plainPassword, dbUser.password_hash);
      if (!isMatch) {
        res.status(401).json({
          error: 'Invalid credentials',
          message: 'The email or password you entered is incorrect.',
        });
        return;
      }

      const tokenUser: TokenUser = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        tenantId: dbUser.tenant_id,
        orgName: dbUser.org_name,
      };

      const token = signToken(tokenUser, 24);
      res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: tokenUser,
      });
      return;
    }

    // 2. Fallback check for configured admin (if not yet in DB)
    const admin = getAdminCredentials();
    if (normalizedEmail === admin.email && plainPassword === admin.password) {
      const tokenUser: TokenUser = {
        id: 'usr_admin_01',
        email: admin.email,
        name: admin.name,
        role: 'admin',
        tenantId: admin.tenantId,
        orgName: admin.orgName,
      };

      const token = signToken(tokenUser, 24);
      res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: tokenUser,
      });
      return;
    }

    // Demo user fallback
    if (normalizedEmail === 'demo@leadmanager.com' && plainPassword === 'demo123') {
      const tokenUser: TokenUser = {
        id: 'usr_demo_02',
        email: 'demo@leadmanager.com',
        name: 'Demo Reviewer',
        role: 'manager',
        tenantId: 'tenant_default',
        orgName: 'Demo Workspace',
      };

      const token = signToken(tokenUser, 24);
      res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: tokenUser,
      });
      return;
    }

    res.status(401).json({
      error: 'Invalid credentials',
      message: 'The email or password you entered is incorrect.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    console.error('Login error:', e);
    res.status(500).json({
      error: 'Login failed',
      message: e.message || 'An error occurred during authentication.',
    });
  }
});

/**
 * GET /api/auth/me
 * Returns profile of the currently authenticated user from Bearer token.
 */
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No Bearer token provided.',
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token is invalid or has expired. Please log in again.',
    });
    return;
  }

  res.json({
    success: true,
    user: {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      tenantId: payload.tenantId,
      orgName: payload.orgName,
    },
  });
});

export default router;
