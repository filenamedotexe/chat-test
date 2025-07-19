import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { appQueries } from '@chat/database';
import { promises as fs } from 'fs';
import path from 'path';
import type { AppConfig, AppDiscoveryResult } from '@chat/shared-types';

const APPS_DIR = path.join(process.cwd(), '../..');

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result: AppDiscoveryResult = {
      discovered: [],
      registered: [],
      errors: []
    };

    // Scan apps directory
    const appsPath = path.join(APPS_DIR, 'apps');
    const appDirs = await fs.readdir(appsPath);

    for (const appDir of appDirs) {
      const appPath = path.join(appsPath, appDir);
      const configPath = path.join(appPath, 'app.config.json');

      try {
        // Check if it's a directory
        const stat = await fs.stat(appPath);
        if (!stat.isDirectory()) continue;

        // Check for app.config.json
        let appConfig: AppConfig;
        try {
          const configContent = await fs.readFile(configPath, 'utf-8');
          appConfig = JSON.parse(configContent);
        } catch {
          // No config file, try to infer from package.json
          const packagePath = path.join(appPath, 'package.json');
          try {
            const packageContent = await fs.readFile(packagePath, 'utf-8');
            const packageJson = JSON.parse(packageContent);
            
            appConfig = {
              name: packageJson.name || appDir,
              slug: appDir,
              description: packageJson.description || '',
              version: packageJson.version || '1.0.0',
              path: '/',
              requires_auth: true,
              author: packageJson.author || '',
              license: packageJson.license || '',
              repository: packageJson.repository?.url || '',
              dev_command: packageJson.scripts?.dev || 'npm run dev',
              build_command: packageJson.scripts?.build || 'npm run build',
              start_command: packageJson.scripts?.start || 'npm run start'
            };
          } catch {
            result.errors.push({
              path: appPath,
              error: 'No app.config.json or package.json found'
            });
            continue;
          }
        }

        // Validate required fields
        if (!appConfig.name || !appConfig.slug) {
          result.errors.push({
            path: appPath,
            error: 'Missing required fields: name or slug'
          });
          continue;
        }

        // Register/update app in database
        const registeredApp = await appQueries.upsertApp({
          name: appConfig.name,
          slug: appConfig.slug,
          description: appConfig.description,
          path: appConfig.path,
          icon: appConfig.icon,
          requires_auth: appConfig.requires_auth,
          version: appConfig.version,
          dependencies: Array.isArray(appConfig.dependencies) 
            ? JSON.stringify(appConfig.dependencies) 
            : appConfig.dependencies,
          author: appConfig.author,
          license: appConfig.license,
          repository: appConfig.repository,
          port: appConfig.port,
          dev_command: appConfig.dev_command,
          build_command: appConfig.build_command,
          start_command: appConfig.start_command
        });

        result.discovered.push({
          ...appConfig,
          id: registeredApp.id,
          is_active: registeredApp.is_active,
          created_at: registeredApp.created_at.toISOString(),
          updated_at: registeredApp.updated_at?.toISOString(),
          last_scanned: registeredApp.last_scanned?.toISOString()
        });

        result.registered.push({
          ...appConfig,
          id: registeredApp.id,
          is_active: registeredApp.is_active,
          created_at: registeredApp.created_at.toISOString(),
          updated_at: registeredApp.updated_at?.toISOString(),
          last_scanned: registeredApp.last_scanned?.toISOString()
        });

      } catch (error) {
        result.errors.push({
          path: appPath,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('App discovery error:', error);
    return NextResponse.json(
      { error: 'Discovery failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}