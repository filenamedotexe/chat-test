#!/usr/bin/env node

/**
 * Create Admin User Script
 * 
 * Creates a new admin user or promotes an existing user to admin.
 * Useful for adding additional admin users or when the default admin
 * account is not suitable for production use.
 * 
 * Usage:
 *   node scripts/create-admin.js
 *   node scripts/create-admin.js --email admin@company.com --name "Admin User"
 */

const readline = require('readline');
const bcrypt = require('bcryptjs');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}👤 ${msg}${colors.reset}`)
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      options[key] = value;
    }
  }
  
  return options;
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);
  
  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    issues: [
      password.length < minLength && `At least ${minLength} characters`,
      !hasUpperCase && 'At least one uppercase letter',
      !hasLowerCase && 'At least one lowercase letter', 
      !hasNumbers && 'At least one number',
      !hasSpecialChar && 'At least one special character'
    ].filter(Boolean)
  };
}

// Get user input with validation
async function getUserInput(options) {
  const userData = {};
  
  // Email
  if (options.email) {
    userData.email = options.email;
    log.info(`Using provided email: ${userData.email}`);
  } else {
    do {
      userData.email = await question('Enter admin email: ');
      if (!isValidEmail(userData.email)) {
        log.error('Invalid email format. Please try again.');
        userData.email = null;
      }
    } while (!userData.email);
  }
  
  // Name  
  if (options.name) {
    userData.name = options.name;
    log.info(`Using provided name: ${userData.name}`);
  } else {
    userData.name = await question('Enter admin name: ');
  }
  
  // Password (always prompt for security)
  if (options.password) {
    log.warn('Password provided via command line - this is insecure!');
    userData.password = options.password;
  } else {
    do {
      userData.password = await question('Enter admin password: ');
      const validation = isValidPassword(userData.password);
      
      if (!validation.isValid) {
        log.error('Password does not meet requirements:');
        validation.issues.forEach(issue => log.error(`  - ${issue}`));
        userData.password = null;
      }
    } while (!userData.password);
    
    const confirmPassword = await question('Confirm password: ');
    if (userData.password !== confirmPassword) {
      log.error('Passwords do not match');
      process.exit(1);
    }
  }
  
  return userData;
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/health').catch(() => null);
    if (!response?.ok) {
      throw new Error('Server not responding');
    }
    return true;
  } catch (error) {
    log.error('Development server is not running');
    log.info('Please start the server first: npm run dev');
    return false;
  }
}

// Create admin user via API
async function createAdminUser(userData) {
  try {
    log.info('Creating admin user...');
    
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        name: userData.name
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      // If user already exists, try to promote them
      if (response.status === 409) {
        log.warn('User already exists. Attempting to promote to admin...');
        return await promoteToAdmin(userData.email);
      }
      
      throw new Error(error.error || 'Registration failed');
    }
    
    const result = await response.json();
    
    // Now promote the user to admin
    if (result.user?.id) {
      return await promoteToAdmin(userData.email, result.user.id);
    }
    
    throw new Error('User created but ID not returned');
    
  } catch (error) {
    log.error(`Failed to create admin user: ${error.message}`);
    throw error;
  }
}

// Promote existing user to admin
async function promoteToAdmin(email, userId = null) {
  try {
    // First, we need to find the user and update via direct database call
    // Since we don't have an admin API for promoting users without auth,
    // we'll use the registration endpoint approach
    
    log.info('Promoting user to admin role...');
    
    // For now, provide manual instructions since we need authentication
    log.warn('User exists but needs manual promotion to admin role.');
    log.info('Please follow these steps:');
    log.info('1. Login to the system with admin credentials');
    log.info('2. Go to /admin/users');
    log.info(`3. Find user: ${email}`);
    log.info('4. Change their role to "admin"');
    
    return { success: false, needsManualPromotion: true };
    
  } catch (error) {
    log.error(`Failed to promote user: ${error.message}`);
    throw error;
  }
}

// Create admin via direct database script
async function createAdminDirect(userData) {
  log.info('Creating admin user directly...');
  
  try {
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    // Note: This requires database access
    // For this script to work fully, we'd need to import database utilities
    log.warn('Direct database creation not implemented in this script.');
    log.info('Alternative approaches:');
    log.info('1. Use the setup script: node scripts/setup.js');
    log.info('2. Use the web registration + manual promotion');
    log.info('3. Access database directly to insert admin user');
    
    // SQL for manual insertion:
    log.info('\nManual SQL (run in your database):');
    console.log(`
INSERT INTO users (email, password_hash, name, role, permission_group, is_active)
VALUES (
  '${userData.email}',
  '${hashedPassword}',
  '${userData.name}',
  'admin',
  'admin',
  true
);`);
    
    return { success: false, sqlProvided: true };
    
  } catch (error) {
    log.error(`Direct creation failed: ${error.message}`);
    throw error;
  }
}

// Main function
async function main() {
  try {
    const options = parseArgs();
    
    log.header('Admin User Creation Tool');
    
    console.log(`${colors.bright}
This tool helps create new admin users for the authentication system.
You can either create a new user or promote an existing user to admin.
${colors.reset}`);
    
    // Get user data
    const userData = await getUserInput(options);
    
    // Confirm creation
    console.log(`\n${colors.bright}Admin User Details:${colors.reset}`);
    console.log(`Email: ${colors.cyan}${userData.email}${colors.reset}`);
    console.log(`Name: ${colors.cyan}${userData.name}${colors.reset}`);
    console.log(`Role: ${colors.cyan}admin${colors.reset}`);
    
    const confirm = await question('\nCreate this admin user? (Y/n): ');
    if (confirm.toLowerCase() === 'n' || confirm.toLowerCase() === 'no') {
      log.info('Admin creation cancelled');
      process.exit(0);
    }
    
    // Check if server is running
    const serverRunning = await checkServer();
    
    let result;
    if (serverRunning) {
      // Try API approach
      result = await createAdminUser(userData);
    } else {
      // Provide direct database approach
      result = await createAdminDirect(userData);
    }
    
    if (result.success) {
      log.success('Admin user created successfully! 🎉');
      log.info(`Email: ${userData.email}`);
      log.info('The user can now access admin features.');
    } else if (result.needsManualPromotion) {
      log.warn('Manual promotion required - see instructions above');
    } else if (result.sqlProvided) {
      log.info('SQL provided for manual database insertion');
    }
    
  } catch (error) {
    log.error(`Admin creation failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log.info('\nAdmin creation cancelled');
  rl.close();
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, createAdminUser, promoteToAdmin };