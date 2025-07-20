#!/usr/bin/env node

/**
 * Setup Script for Chat Authentication System
 * 
 * This script automates the initial setup process:
 * 1. Creates database schema
 * 2. Sets up initial admin user
 * 3. Registers default apps
 * 4. Initializes permission templates
 * 
 * Usage:
 *   node scripts/setup.js
 *   npm run setup (if added to package.json)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}🚀 ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.magenta}📋${colors.reset} ${msg}`)
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

// Check if we're in the correct directory
function validateEnvironment() {
  log.header('Validating Environment');
  
  const requiredFiles = [
    'package.json',
    'app',
    'packages/auth',
    'packages/database'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log.error(`Required file/directory not found: ${file}`);
      log.error('Please run this script from the project root directory');
      process.exit(1);
    }
  }
  
  log.success('Environment validation passed');
}

// Check environment variables
function checkEnvVariables() {
  log.header('Checking Environment Variables');
  
  const envPath = path.join(__dirname, '../app/.env.local');
  if (!fs.existsSync(envPath)) {
    log.error('.env.local not found in app/');
    log.error('Please create .env.local with required variables:');
    log.info('  DATABASE_URL="postgresql://..."');
    log.info('  OPENAI_API_KEY="sk-..."');
    log.info('  NEXTAUTH_SECRET="your-secret"');
    log.info('  NEXTAUTH_URL="http://localhost:3000"');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['DATABASE_URL', 'OPENAI_API_KEY', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    log.error('Missing required environment variables:');
    missingVars.forEach(varName => log.error(`  ${varName}`));
    process.exit(1);
  }
  
  log.success('Environment variables found');
}

// Install dependencies if needed
async function checkDependencies() {
  log.header('Checking Dependencies');
  
  const nodeModulesExists = fs.existsSync('node_modules');
  if (!nodeModulesExists) {
    log.warn('node_modules not found');
    const installDeps = await question('Install dependencies now? (y/N): ');
    
    if (installDeps.toLowerCase() === 'y' || installDeps.toLowerCase() === 'yes') {
      log.step('Installing dependencies...');
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const npm = spawn('npm', ['install'], { stdio: 'inherit' });
        npm.on('close', (code) => {
          if (code === 0) {
            log.success('Dependencies installed');
            resolve();
          } else {
            log.error('Failed to install dependencies');
            reject(new Error('npm install failed'));
          }
        });
      });
    } else {
      log.error('Dependencies required. Please run: npm install');
      process.exit(1);
    }
  } else {
    log.success('Dependencies found');
  }
}

// Setup database schema
async function setupDatabase() {
  log.header('Setting Up Database');
  
  log.step('Starting development server to access setup endpoint...');
  
  // Check if server is already running
  try {
    const response = await fetch('http://localhost:3000/api/hello').catch(() => null);
    if (response?.ok) {
      log.success('Development server is already running');
    } else {
      throw new Error('Server not running');
    }
  } catch (error) {
    log.warn('Development server not running');
    log.info('Please start the development server in another terminal:');
    log.info('  npm run dev');
    log.info('Then press Enter to continue...');
    await question('Press Enter when server is running: ');
  }
  
  log.step('Setting up database schema...');
  
  try {
    const response = await fetch('http://localhost:3000/api/setup-auth-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      log.success('Database schema created successfully');
      
      if (result.admin_created) {
        log.success('Default admin user created:');
        log.info('  Email: admin@example.com');
        log.info('  Password: AdminPass123!');
        log.warn('Please change the admin password after first login!');
      }
      
      if (result.tables_created) {
        log.success(`Created ${result.tables_created.length} database tables`);
      }
    } else {
      const error = await response.text();
      log.error(`Database setup failed: ${error}`);
      throw new Error('Database setup failed');
    }
  } catch (error) {
    log.error(`Database setup error: ${error.message}`);
    throw error;
  }
}

// Discover and register apps
async function discoverApps() {
  log.header('Discovering Applications');
  
  try {
    log.step('Scanning for applications...');
    
    const response = await fetch('http://localhost:3000/api/admin/discover-apps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.discovered && result.discovered.length > 0) {
        log.success(`Discovered and registered ${result.discovered.length} apps:`);
        result.discovered.forEach(app => {
          log.info(`  📱 ${app.name} (${app.slug}) - ${app.status}`);
        });
      } else {
        log.warn('No apps found to register');
        log.info('Apps should have app.config.json files in their directories');
      }
      
      if (result.errors && result.errors.length > 0) {
        log.warn('Some apps had registration errors:');
        result.errors.forEach(error => log.warn(`  ${error}`));
      }
    } else {
      const error = await response.text();
      log.error(`App discovery failed: ${error}`);
      // Don't throw - this is not critical for setup
    }
  } catch (error) {
    log.warn(`App discovery error: ${error.message}`);
    log.info('You can manually discover apps later from the admin dashboard');
  }
}

// Create sample app configs if they don't exist
function createSampleAppConfigs() {
  log.header('Creating Sample App Configurations');
  
  const sampleApps = [
    {
      dir: 'app',
      config: {
        name: 'Chat Application',
        slug: 'chat',
        description: 'AI-powered chat interface with LangChain integration',
        version: '1.0.0',
        path: '/chat',
        requires_auth: true,
        default_permissions: ['chat.read', 'chat.write', 'prompts.read'],
        icon: '💬'
      }
    }
  ];
  
  sampleApps.forEach(app => {
    const configPath = path.join(app.dir, 'app.config.json');
    
    if (!fs.existsSync(configPath)) {
      log.step(`Creating app config for ${app.config.name}...`);
      fs.writeFileSync(configPath, JSON.stringify(app.config, null, 2));
      log.success(`Created ${configPath}`);
    } else {
      log.info(`App config already exists: ${configPath}`);
    }
  });
}

// Setup completion message
function showCompletionMessage() {
  log.header('Setup Complete! 🎉');
  
  console.log(`
${colors.green}✅ Authentication system is ready!${colors.reset}

${colors.bright}Next Steps:${colors.reset}
1. Start the development server: ${colors.cyan}npm run dev${colors.reset}
2. Visit: ${colors.cyan}http://localhost:3000${colors.reset}
3. Login with admin credentials:
   Email: ${colors.yellow}admin@example.com${colors.reset}
   Password: ${colors.yellow}AdminPass123!${colors.reset}
4. ${colors.red}Change the admin password immediately!${colors.reset}
5. Access admin dashboard: ${colors.cyan}http://localhost:3000/admin${colors.reset}

${colors.bright}Admin Dashboard Features:${colors.reset}
• User management
• App permissions
• Chat history oversight
• System analytics

${colors.bright}Documentation:${colors.reset}
• Authentication Guide: ${colors.cyan}docs/AUTHENTICATION.md${colors.reset}
• Admin Guide: ${colors.cyan}docs/ADMIN_GUIDE.md${colors.reset}
• API Reference: ${colors.cyan}docs/API_REFERENCE.md${colors.reset}

${colors.bright}Testing:${colors.reset}
• Security audit: ${colors.cyan}npm run test:security${colors.reset}
• Auth tests: ${colors.cyan}npm run test:auth${colors.reset}
• Performance: ${colors.cyan}node tests/performance-test.js${colors.reset}
`);
}

// Main setup function
async function main() {
  try {
    console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        🚀 Chat Authentication System Setup 🚀            ║
║                                                          ║
║  This script will set up your authentication system     ║
║  with database schema, admin user, and app registry.    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);
    
    // Pre-setup validation
    validateEnvironment();
    checkEnvVariables();
    await checkDependencies();
    
    // Confirm setup
    const confirm = await question('\nProceed with setup? (Y/n): ');
    if (confirm.toLowerCase() === 'n' || confirm.toLowerCase() === 'no') {
      log.info('Setup cancelled');
      process.exit(0);
    }
    
    // Setup steps
    createSampleAppConfigs();
    await setupDatabase();
    await discoverApps();
    
    // Completion
    showCompletionMessage();
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    console.log(`\n${colors.bright}Troubleshooting:${colors.reset}`);
    console.log('1. Ensure database is accessible');
    console.log('2. Check environment variables');
    console.log('3. Verify development server is running');
    console.log('4. Check logs for detailed error information');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log.info('\nSetup interrupted');
  rl.close();
  process.exit(0);
});

// Run setup if called directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  validateEnvironment,
  checkEnvVariables,
  setupDatabase,
  discoverApps
};