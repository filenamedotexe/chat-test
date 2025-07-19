#!/usr/bin/env node

/**
 * App Migration Script
 * 
 * This script helps migrate app configurations and register them in the database.
 * It can also update existing app configurations and handle bulk app operations.
 * 
 * Usage:
 *   node scripts/migrate-apps.js                    # Discover and register all apps
 *   node scripts/migrate-apps.js --app notes        # Register specific app
 *   node scripts/migrate-apps.js --update           # Update existing app configs
 *   node scripts/migrate-apps.js --cleanup          # Remove inactive apps
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}📱 ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.magenta}📋${colors.reset} ${msg}`)
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    app: null,
    update: false,
    cleanup: false,
    force: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--app' && args[i + 1]) {
      options.app = args[i + 1];
      i++;
    } else if (arg === '--update') {
      options.update = true;
    } else if (arg === '--cleanup') {
      options.cleanup = true;
    } else if (arg === '--force') {
      options.force = true;
    }
  }
  
  return options;
}

// Find all app directories
function findAppDirectories() {
  const appsDir = path.join(process.cwd(), 'apps');
  
  if (!fs.existsSync(appsDir)) {
    log.error('Apps directory not found');
    return [];
  }
  
  const entries = fs.readdirSync(appsDir, { withFileTypes: true });
  const appDirs = entries
    .filter(entry => entry.isDirectory())
    .map(entry => ({
      name: entry.name,
      path: path.join(appsDir, entry.name),
      configPath: path.join(appsDir, entry.name, 'app.config.json')
    }));
  
  return appDirs;
}

// Read app configuration
function readAppConfig(configPath) {
  try {
    if (!fs.existsSync(configPath)) {
      return null;
    }
    
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);
    
    // Validate required fields
    const required = ['name', 'slug', 'version', 'path'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      log.warn(`Invalid config ${configPath}: missing ${missing.join(', ')}`);
      return null;
    }
    
    return config;
  } catch (error) {
    log.error(`Failed to read config ${configPath}: ${error.message}`);
    return null;
  }
}

// Create sample app config
function createSampleConfig(appDir) {
  const appName = path.basename(appDir.path);
  const config = {
    name: appName.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    slug: appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    description: `${appName} application`,
    version: '1.0.0',
    path: `/${appName}`,
    requires_auth: true,
    default_permissions: [`${appName}.read`, `${appName}.write`],
    icon: '📱'
  };
  
  return config;
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/health').catch(() => null);
    return response?.ok || false;
  } catch (error) {
    return false;
  }
}

// Register apps via API
async function registerApps(specificApp = null) {
  try {
    log.step('Contacting app discovery API...');
    
    const response = await fetch('http://localhost:3001/api/admin/discover-apps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }
    
    const result = await response.json();
    
    // Filter results if specific app requested
    if (specificApp) {
      result.discovered = result.discovered?.filter(app => 
        app.slug === specificApp || app.name.toLowerCase().includes(specificApp.toLowerCase())
      ) || [];
    }
    
    return result;
  } catch (error) {
    log.error(`API registration failed: ${error.message}`);
    throw error;
  }
}

// Manual app registration (when server not available)
function registerAppsManually(appDirs, specificApp = null) {
  log.step('Processing apps manually...');
  
  const results = {
    discovered: [],
    errors: []
  };
  
  for (const appDir of appDirs) {
    if (specificApp && !appDir.name.includes(specificApp)) {
      continue;
    }
    
    let config = readAppConfig(appDir.configPath);
    
    if (!config) {
      if (specificApp || appDir.name !== 'node_modules') {
        log.step(`Creating config for ${appDir.name}...`);
        config = createSampleConfig(appDir);
        
        try {
          fs.writeFileSync(appDir.configPath, JSON.stringify(config, null, 2));
          log.success(`Created config: ${appDir.configPath}`);
        } catch (error) {
          results.errors.push(`Failed to create config for ${appDir.name}: ${error.message}`);
          continue;
        }
      } else {
        continue;
      }
    }
    
    results.discovered.push({
      name: config.name,
      slug: config.slug,
      path: config.path,
      configPath: appDir.configPath,
      status: 'config_ready'
    });
  }
  
  return results;
}

// Update existing app configs
async function updateAppConfigs(appDirs) {
  log.header('Updating App Configurations');
  
  const updates = [];
  
  for (const appDir of appDirs) {
    const config = readAppConfig(appDir.configPath);
    
    if (config) {
      let updated = false;
      
      // Add missing fields with defaults
      if (!config.requires_auth) {
        config.requires_auth = true;
        updated = true;
      }
      
      if (!config.default_permissions) {
        config.default_permissions = [`${config.slug}.read`, `${config.slug}.write`];
        updated = true;
      }
      
      if (!config.icon) {
        config.icon = '📱';
        updated = true;
      }
      
      if (!config.description) {
        config.description = `${config.name} application`;
        updated = true;
      }
      
      if (updated) {
        try {
          fs.writeFileSync(appDir.configPath, JSON.stringify(config, null, 2));
          log.success(`Updated config: ${appDir.name}`);
          updates.push(appDir.name);
        } catch (error) {
          log.error(`Failed to update config for ${appDir.name}: ${error.message}`);
        }
      } else {
        log.info(`Config up to date: ${appDir.name}`);
      }
    }
  }
  
  return updates;
}

// Clean up inactive apps
async function cleanupInactiveApps() {
  log.header('Cleaning Up Inactive Apps');
  
  // This would require API access to check database
  // For now, just identify apps without configs
  
  const appDirs = findAppDirectories();
  const inactiveApps = appDirs.filter(appDir => {
    const config = readAppConfig(appDir.configPath);
    return !config;
  });
  
  if (inactiveApps.length === 0) {
    log.success('No inactive apps found');
    return;
  }
  
  log.info(`Found ${inactiveApps.length} apps without configurations:`);
  inactiveApps.forEach(app => {
    log.info(`  📁 ${app.name}`);
  });
  
  log.info('To clean up, you can:');
  log.info('1. Add app.config.json files to make them active');
  log.info('2. Remove directories if no longer needed');
  log.info('3. Use database admin tools to remove from registry');
}

// Display results
function displayResults(results, operation = 'registration') {
  if (results.discovered && results.discovered.length > 0) {
    log.success(`${operation} completed for ${results.discovered.length} apps:`);
    results.discovered.forEach(app => {
      log.info(`  📱 ${app.name} (${app.slug}) - ${app.status || 'processed'}`);
    });
  } else {
    log.warn(`No apps found for ${operation}`);
  }
  
  if (results.errors && results.errors.length > 0) {
    log.warn(`${results.errors.length} errors occurred:`);
    results.errors.forEach(error => {
      log.error(`  ${error}`);
    });
  }
}

// Main function
async function main() {
  try {
    const options = parseArgs();
    
    log.header('App Migration Tool');
    
    if (options.cleanup) {
      await cleanupInactiveApps();
      return;
    }
    
    // Find all app directories
    const appDirs = findAppDirectories();
    
    if (appDirs.length === 0) {
      log.error('No app directories found in apps/');
      return;
    }
    
    log.info(`Found ${appDirs.length} app directories`);
    
    // Update configs if requested
    if (options.update) {
      const updates = await updateAppConfigs(appDirs);
      log.success(`Updated ${updates.length} app configurations`);
    }
    
    // Register apps
    const serverRunning = await checkServer();
    let results;
    
    if (serverRunning) {
      log.step('Development server detected, using API...');
      results = await registerApps(options.app);
    } else {
      log.warn('Development server not running, processing manually...');
      log.info('Start server with: npm run dev');
      results = registerAppsManually(appDirs, options.app);
    }
    
    displayResults(results);
    
    // Next steps
    if (!serverRunning && results.discovered.length > 0) {
      log.info('\nNext steps:');
      log.info('1. Start development server: npm run dev');
      log.info('2. Login as admin and visit /admin');
      log.info('3. Click "Discover Apps" to register in database');
    }
    
    log.success('App migration completed! 🎉');
    
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
}

// Show help
function showHelp() {
  console.log(`
${colors.bright}App Migration Tool${colors.reset}

Manages app discovery, registration, and configuration.

${colors.bright}Usage:${colors.reset}
  node scripts/migrate-apps.js [options]

${colors.bright}Options:${colors.reset}
  --app <name>     Process specific app only
  --update         Update existing app configurations
  --cleanup        Remove inactive apps
  --force          Force operation without confirmation

${colors.bright}Examples:${colors.reset}
  node scripts/migrate-apps.js                    # Discover all apps
  node scripts/migrate-apps.js --app notes        # Process notes app only
  node scripts/migrate-apps.js --update           # Update all configs
  node scripts/migrate-apps.js --cleanup          # Clean up inactive apps

${colors.bright}App Configuration Format:${colors.reset}
  {
    "name": "Notes Application",
    "slug": "notes",
    "description": "Personal note-taking app",
    "version": "1.0.0", 
    "path": "/notes",
    "requires_auth": true,
    "default_permissions": ["notes.read", "notes.write"],
    "icon": "📝"
  }
`);
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  findAppDirectories,
  readAppConfig,
  registerApps,
  updateAppConfigs
};