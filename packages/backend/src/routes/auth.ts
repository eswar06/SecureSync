import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { redisClient } from '../cache/redis';
import { asyncHandler, ValidationError, UnauthorizedError } from '../middleware/error-handler';
import { ApiResponse, User, UserRole } from '../../../shared/src/types/index';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('organization').trim().isLength({ min: 2, max: 100 })
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { email, password, name, organization } = req.body;

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new ValidationError('User already exists with this email');
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const user: User = {
    id: userId,
    email,
    name,
    role: UserRole.USER,
    organization,
    permissions: {
      canCreateMeetings: true,
      canRecordMeetings: false,
      canAccessPrivateChannels: true,
      canManageDocuments: true,
      canViewAnalytics: false,
      canManageUsers: false,
      crossCompanyAccess: false
    },
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        inApp: true,
        reminders: true,
        mentions: true
      },
      uiAdaptation: {
        adaptByRole: true,
        adaptByIndustry: true,
        adaptByBehavior: true,
        customizations: {}
      }
    },
    lastActive: new Date(),
    isOnline: false
  };

  // Store user data
  await storeUser(user, hashedPassword);

  // Generate tokens
  const tokens = generateTokens(user);

  // Store refresh token
  await redisClient.setex(`refresh_token:${userId}`, 7 * 24 * 3600, tokens.refreshToken);

  logger.audit('User registered', {
    userId,
    email,
    name,
    organization
  });

  const response: ApiResponse<{ user: Omit<User, 'password'>, tokens: any }> = {
    success: true,
    data: {
      user,
      tokens
    }
  };

  res.status(201).json(response);
}));

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { email, password } = req.body;

  // Get user with password
  const userWithPassword = await getUserWithPassword(email);
  if (!userWithPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, userWithPassword.password);
  if (!isValidPassword) {
    // Log failed login attempt
    logger.security('Failed login attempt', {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });
    
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if user is banned
  const isBanned = await redisClient.exists(`ban:${userWithPassword.id}`);
  if (isBanned) {
    logger.security('Banned user attempted login', {
      userId: userWithPassword.id,
      email,
      ip: req.ip
    });
    throw new UnauthorizedError('Account is temporarily suspended');
  }

  // Remove password from user object
  const { password: _, ...user } = userWithPassword;

  // Update last active
  user.lastActive = new Date();
  user.isOnline = true;
  await updateUser(user);

  // Generate tokens
  const tokens = generateTokens(user);

  // Store refresh token
  await redisClient.setex(`refresh_token:${user.id}`, 7 * 24 * 3600, tokens.refreshToken);

  logger.audit('User logged in', {
    userId: user.id,
    email,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const response: ApiResponse<{ user: User, tokens: any }> = {
    success: true,
    data: {
      user,
      tokens
    }
  };

  res.json(response);
}));

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token required');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as any;
    
    // Check if token exists in Redis
    const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Get user
    const user = await getUserById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Store new refresh token
    await redisClient.setex(`refresh_token:${user.id}`, 7 * 24 * 3600, tokens.refreshToken);

    // Remove old refresh token
    if (storedToken !== tokens.refreshToken) {
      await redisClient.del(`refresh_token:${user.id}`);
    }

    const response: ApiResponse<{ tokens: any }> = {
      success: true,
      data: { tokens }
    };

    res.json(response);

  } catch (error) {
    logger.warn('Invalid refresh token attempt', {
      error: (error instanceof Error ? error.message : String(error)),
      ip: req.ip
    });
    throw new UnauthorizedError('Invalid refresh token');
  }
}));

/**
 * POST /api/auth/logout
 * Logout user and invalidate tokens
 */
router.post('/logout', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { refreshToken } = req.body;
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const accessToken = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'secret') as any;
      
      // Add access token to blacklist
      const tokenExp = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = tokenExp - now;
      
      if (ttl > 0) {
        await redisClient.setex(`blacklisted_token:${accessToken}`, ttl, 'true');
      }

      // Remove refresh token
      if (refreshToken) {
        await redisClient.del(`refresh_token:${decoded.userId}`);
      }

      // Update user online status
      const user = await getUserById(decoded.userId);
      if (user) {
        user.isOnline = false;
        await updateUser(user);
      }

      logger.audit('User logged out', {
        userId: decoded.userId,
        ip: req.ip
      });

    } catch (error) {
      // Token might be invalid, but that's okay for logout
      logger.debug('Logout with invalid token', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'Logged out successfully' }
  };

  res.json(response);
}));

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { email } = req.body;

  // Check if user exists
  const user = await getUserByEmail(email);
  if (!user) {
    // Don't reveal if email exists or not
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'If the email exists, a password reset link has been sent' }
    };
    return res.json(response);
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1h' }
  );

  // Store reset token in Redis
  await redisClient.setex(`password_reset:${user.id}`, 3600, resetToken);

  // In a real application, send email with reset link
  logger.info('Password reset requested', {
    userId: user.id,
    email,
    ip: req.ip
  });

  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'If the email exists, a password reset link has been sent' }
  };

  res.json(response);
}));

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', [
  body('token').isLength({ min: 1 }),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { token, password } = req.body;

  try {
    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    // Check if token exists in Redis
    const storedToken = await redisClient.get(`password_reset:${decoded.userId}`);
    if (storedToken !== token) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    // Get user
    const user = await getUserById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password
    await updateUserPassword(user.id, hashedPassword);

    // Remove reset token
    await redisClient.del(`password_reset:${decoded.userId}`);

    // Invalidate all existing refresh tokens for this user
    const refreshTokenKeys = await redisClient.keys(`refresh_token:${user.id}*`);
    if (refreshTokenKeys.length > 0) {
      await (redisClient as any).del(...refreshTokenKeys);
    }

    logger.audit('Password reset completed', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Password reset successfully' }
    };

    res.json(response);

  } catch (error) {
    logger.warn('Invalid password reset attempt', {
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip
    });
    throw new UnauthorizedError('Invalid or expired reset token');
  }
}));

// Helper functions

function generateTokens(user: User) {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization,
      permissions: user.permissions
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

async function storeUser(user: User, hashedPassword: string): Promise<void> {
  // Store user data in Redis (in production, use a proper database)
  await redisClient.setex(
    `user:${user.id}`,
    3600 * 24 * 365, // 1 year
    JSON.stringify(user)
  );

  // Store password separately
  await redisClient.setex(
    `user_password:${user.id}`,
    3600 * 24 * 365, // 1 year
    hashedPassword
  );

  // Store email to user ID mapping
  await redisClient.setex(
    `user_email:${user.email}`,
    3600 * 24 * 365, // 1 year
    user.id
  );
}

async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const userId = await redisClient.get(`user_email:${email}`);
    if (!userId) return null;

    const userData = await redisClient.get(`user:${userId}`);
    if (!userData) return null;

    return JSON.parse(userData);
  } catch (error) {
    logger.error('Failed to get user by email:', error);
    return null;
  }
}

async function getUserById(userId: string): Promise<User | null> {
  try {
    const userData = await redisClient.get(`user:${userId}`);
    if (!userData) return null;

    return JSON.parse(userData);
  } catch (error) {
    logger.error('Failed to get user by ID:', error);
    return null;
  }
}

async function getUserWithPassword(email: string): Promise<(User & { password: string }) | null> {
  try {
    const user = await getUserByEmail(email);
    if (!user) return null;

    const password = await redisClient.get(`user_password:${user.id}`);
    if (!password) return null;

    return { ...user, password };
  } catch (error) {
    logger.error('Failed to get user with password:', error);
    return null;
  }
}

async function updateUser(user: User): Promise<void> {
  try {
    await redisClient.setex(
      `user:${user.id}`,
      3600 * 24 * 365, // 1 year
      JSON.stringify(user)
    );
  } catch (error) {
    logger.error('Failed to update user:', error);
  }
}

async function updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
  try {
    await redisClient.setex(
      `user_password:${userId}`,
      3600 * 24 * 365, // 1 year
      hashedPassword
    );
  } catch (error) {
    logger.error('Failed to update user password:', error);
  }
}

export { router as authRouter };
