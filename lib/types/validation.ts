// Input validation and sanitization utilities

import DOMPurify from 'isomorphic-dompurify';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

export class SecurityValidator {
  // Email validation
  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (email.length > 254) {
      return { isValid: false, error: 'Email too long' };
    }
    
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }
    
    // Check for SQL injection patterns
    const sqlPatterns = [
      /['";]/,
      /(\bor\b|\band\b)\s*['"]?\s*\w+\s*['"]?\s*=\s*['"]?\w+/i,
      /\bunion\b.*\bselect\b/i,
      /\bdrop\b.*\btable\b/i,
      /\binsert\b.*\binto\b/i,
      /\bdelete\b.*\bfrom\b/i,
      /\bupdate\b.*\bset\b/i
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(email)) {
        return { isValid: false, error: 'Invalid characters in email' };
      }
    }
    
    return { isValid: true, sanitized: email.toLowerCase().trim() };
  }

  // Password validation
  static validatePassword(password: string): ValidationResult {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password is required' };
    }
    
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }
    
    if (password.length > 128) {
      return { isValid: false, error: 'Password too long' };
    }
    
    // Check for basic strength requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?:{}|<>]/.test(password);
    
    const strengthChecks = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar];
    const strengthScore = strengthChecks.filter(Boolean).length;
    
    if (strengthScore < 3) {
      return { 
        isValid: false, 
        error: 'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters' 
      };
    }
    
    return { isValid: true };
  }

  // Name/text validation and sanitization
  static validateText(text: string, maxLength = 255): ValidationResult {
    if (!text || typeof text !== 'string') {
      return { isValid: false, error: 'Text is required' };
    }
    
    if (text.length > maxLength) {
      return { isValid: false, error: `Text too long (max ${maxLength} characters)` };
    }
    
    // Sanitize HTML/XSS
    const sanitized = DOMPurify.sanitize(text.trim(), { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [] 
    });
    
    // Check if sanitization removed content (potential XSS)
    if (sanitized !== text.trim()) {
      return { 
        isValid: false, 
        error: 'Text contains invalid characters or HTML',
        sanitized 
      };
    }
    
    // Check for SQL injection patterns
    const sqlPatterns = [
      /['";]/,
      /\b(select|insert|update|delete|drop|union|exec|execute)\b/i,
      /--/,
      /\/\*/,
      /\*\//
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(text)) {
        return { isValid: false, error: 'Text contains invalid characters' };
      }
    }
    
    return { isValid: true, sanitized };
  }

  // Role validation
  static validateRole(role: string): ValidationResult {
    const validRoles = ['admin', 'user'];
    
    if (!validRoles.includes(role)) {
      return { isValid: false, error: 'Invalid role' };
    }
    
    return { isValid: true, sanitized: role };
  }

  // Permission group validation
  static validatePermissionGroup(groupId: string): ValidationResult {
    const validGroups = [
      'default_user',
      'notes_user_group',
      'analyst',
      'power_user',
      'admin'
    ];
    
    if (!validGroups.includes(groupId)) {
      return { isValid: false, error: 'Invalid permission group' };
    }
    
    return { isValid: true, sanitized: groupId };
  }

  // App slug validation
  static validateAppSlug(slug: string): ValidationResult {
    if (!slug || typeof slug !== 'string') {
      return { isValid: false, error: 'App slug is required' };
    }
    
    // Allow only alphanumeric characters, hyphens, and underscores
    const slugRegex = /^[a-z0-9-_]+$/;
    
    if (!slugRegex.test(slug)) {
      return { isValid: false, error: 'Invalid app slug format' };
    }
    
    if (slug.length > 50) {
      return { isValid: false, error: 'App slug too long' };
    }
    
    return { isValid: true, sanitized: slug };
  }

  // Generic ID validation
  static validateId(id: any): ValidationResult {
    const numId = parseInt(id);
    
    if (isNaN(numId) || numId < 1) {
      return { isValid: false, error: 'Invalid ID' };
    }
    
    if (numId > 2147483647) { // Max int32
      return { isValid: false, error: 'ID too large' };
    }
    
    return { isValid: true, sanitized: String(numId) };
  }

  // URL validation
  static validateUrl(url: string): ValidationResult {
    try {
      const parsed = new URL(url);
      
      // Only allow http and https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { isValid: false, error: 'Invalid URL protocol' };
      }
      
      return { isValid: true, sanitized: url };
    } catch {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  // JSON validation
  static validateJson(jsonString: string): ValidationResult {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Prevent prototype pollution
      if (typeof parsed === 'object' && parsed !== null) {
        if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
          return { isValid: false, error: 'Invalid JSON structure' };
        }
      }
      
      return { isValid: true, sanitized: jsonString };
    } catch {
      return { isValid: false, error: 'Invalid JSON format' };
    }
  }
}

// Middleware helper for request validation
export function validateRequest(validations: Record<string, (value: any) => ValidationResult>) {
  return (req: any, res: any, next: any) => {
    const errors: Record<string, string> = {};
    
    for (const [field, validator] of Object.entries(validations)) {
      const value = req.body?.[field];
      const result = validator(value);
      
      if (!result.isValid) {
        errors[field] = result.error!;
      } else if (result.sanitized !== undefined) {
        req.body[field] = result.sanitized;
      }
    }
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }
    
    next();
  };
}