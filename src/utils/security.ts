
import { sanitizeText, sanitizeHtml, sanitizeEmail } from './sanitize';

/**
 * Security configuration and validation utilities
 */

// Rate limiting configuration
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  ASSIGNMENT_CREATION: { max: 10, windowMs: 60 * 60 * 1000 }, // 10 assignments per hour
  CONTACT_MESSAGES: { max: 3, windowMs: 60 * 60 * 1000 } // 3 messages per hour
} as const;

// Content Security Policy headers
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.gpteng.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.lemonsqueezy.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')
};

// Validate file uploads
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
};

// Sanitize user input for database operations
export const sanitizeUserInput = (input: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      // Sanitize based on field type
      if (key.includes('email')) {
        sanitized[key] = sanitizeEmail(value);
      } else if (key === 'description') {
        sanitized[key] = sanitizeHtml(value);
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Check if user has required permissions
export const hasPermission = (userRole: string | null, requiredRole: string): boolean => {
  const roleHierarchy = {
    admin: 3,
    writer: 2,
    student: 1
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
};

// Mask sensitive data for logging
export const maskSensitiveData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = ['password', 'token', 'key', 'secret', 'email', 'phone'];
  const masked = { ...data };

  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '***MASKED***';
    }
  }

  return masked;
};

// Generate secure random string
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
