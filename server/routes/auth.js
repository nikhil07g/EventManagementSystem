const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ALLOWED_SIGNUP_ROLES = ['user', 'organizer'];

const sendSuccess = (res, status, data, message) =>
  res.status(status).json({ success: true, message, data });

const sendError = (res, status, message, errors) =>
  res.status(status).json({ success: false, message, errors });

const normalizeRole = (role) =>
  ALLOWED_SIGNUP_ROLES.includes(role) ? role : 'user';

const sanitizeEmail = (email) => email.trim().toLowerCase();

const sanitizeUser = (user) => (typeof user.toSafeObject === 'function' ? user.toSafeObject() : user);

const issueToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const validateRegisterPayload = (payload = {}) => {
  const errors = {};
  const data = {};

  if (!payload.email || !EMAIL_PATTERN.test(payload.email)) {
    errors.email = 'A valid email address is required.';
  } else {
    data.email = sanitizeEmail(payload.email);
  }

  if (!payload.password || typeof payload.password !== 'string' || payload.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  } else {
    data.password = payload.password;
  }

  if (!payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
    errors.name = 'Name is required.';
  } else {
    data.name = payload.name.trim();
  }

  data.role = normalizeRole(payload.role);

  return { data, errors };
};

const validateLoginPayload = (payload = {}) => {
  const errors = {};
  const data = {};

  if (!payload.email || !EMAIL_PATTERN.test(payload.email)) {
    errors.email = 'A valid email address is required.';
  } else {
    data.email = sanitizeEmail(payload.email);
  }

  if (!payload.password || typeof payload.password !== 'string') {
    errors.password = 'Password is required.';
  } else {
    data.password = payload.password;
  }

  return { data, errors };
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { data, errors } = validateRegisterPayload(req.body);
    if (Object.keys(errors).length) {
      return sendError(res, 422, 'Validation failed.', errors);
    }

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return sendError(res, 409, 'User already exists.');
    }

    const user = new User(data);
    await user.save();

    const token = issueToken(user);
    return sendSuccess(res, 201, { token, user: sanitizeUser(user) }, 'User registered successfully.');
  } catch (error) {
    console.error('Registration error:', error);
    return sendError(res, 500, 'Server error during registration.');
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { data, errors } = validateLoginPayload(req.body);
    if (Object.keys(errors).length) {
      return sendError(res, 422, 'Validation failed.', errors);
    }

    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid credentials.');
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid credentials.');
    }

    const token = issueToken(user);
    return sendSuccess(res, 200, { token, user: sanitizeUser(user) }, 'Login successful.');
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 500, 'Server error during login.');
  }
});

// Google OAuth Login
router.post('/google', async (req, res) => {
  try {
    const { credential, role } = req.body || {};

    if (!credential) {
      return sendError(res, 400, 'Google credential is required.');
    }

    if (!googleClient || !GOOGLE_CLIENT_ID) {
      return sendError(res, 500, 'Google OAuth is not configured.');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email) {
      return sendError(res, 400, 'Google account does not provide an email address.');
    }

    const normalizedEmail = sanitizeEmail(email);
    const normalizedRole = normalizeRole(role);

    let user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      user = new User({
        email: normalizedEmail,
        name: payload?.name?.trim() || 'Google User',
        role: normalizedRole,
        googleId: payload.sub,
        avatar: payload.picture,
        password: crypto.randomBytes(16).toString('hex'),
      });
    } else {
      if (!user.googleId) {
        user.googleId = payload.sub;
      }
      if (!user.avatar && payload.picture) {
        user.avatar = payload.picture;
      }
      if (user.role === 'user' && normalizedRole !== 'user') {
        user.role = normalizedRole;
      }
    }

    await user.save();

    const token = issueToken(user);
    return sendSuccess(res, 200, { token, user: sanitizeUser(user) }, 'Google login successful.');
  } catch (error) {
    console.error('Google OAuth error:', error);
    const message =
      error.message && error.message.toLowerCase().includes('token')
        ? 'Google token is invalid or expired.'
        : 'Server error during Google authentication.';
    return sendError(res, 401, message);
  }
});

// Verify token (protected route)
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    return sendSuccess(res, 200, { user: sanitizeUser(user) }, undefined);
  } catch (error) {
    console.error('Token verification error:', error);
    return sendError(res, 500, 'Unable to verify session.');
  }
});

// Authenticated profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    return sendSuccess(res, 200, { user: sanitizeUser(user) }, undefined);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return sendError(res, 500, 'Unable to fetch profile.');
  }
});

module.exports = router;