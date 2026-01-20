const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Password hashing
async function hashPassword(password) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
}

// Password verification
async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate secure random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Email validation
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Password validation
function validatePassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password) && password.length <= 128;
}

// Sanitize input
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
}

// Rate limiting helper (simple in-memory store)
const rateLimitStore = new Map();

function checkRateLimit(identifier, maxRequests, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, []);
  }

  const requests = rateLimitStore.get(identifier);
  // Remove old requests
  const validRequests = requests.filter(time => time > windowStart);

  if (validRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  validRequests.push(now);
  rateLimitStore.set(identifier, validRequests);
  return true; // Within limit
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const cutoff = now - windowMs;

  for (const [key, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(time => time > cutoff);
    if (validRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validRequests);
    }
  }
}, 60 * 1000); // Clean up every minute

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  validateEmail,
  validatePassword,
  sanitizeInput,
  checkRateLimit
};