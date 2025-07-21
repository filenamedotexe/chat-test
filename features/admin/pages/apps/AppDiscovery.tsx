'use client';

import { useState } from 'react';
import type { AppDiscoveryResult } from '@/types';

export default function AppDiscovery() {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<AppDiscoveryResult | null>(null);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const response = await fetch('/api/admin/migrate-apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (response.ok) {
        setMigrationResult(data.message);
      } else {
        setMigrationResult(`Migration failed: ${data.error}`);
      }
    } catch (error) {
      setMigrationResult(`Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDiscovery = async () => {
    setIsDiscovering(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/discover-apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setResult({
          discovered: [],
          registered: [],
          errors: [{ path: 'API', error: data.error }]
        });
      }
    } catch (error) {
      setResult({
        discovered: [],
        registered: [],
        errors: [{ path: 'Network', error: error instanceof Error ? error.message : 'Unknown error' }]
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">App Discovery</h2>
        <p className="text-gray-400 mt-1">Scan and register applications in the /apps directory</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleMigration}
          disabled={isMigrating}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMigrating ? 'Migrating...' : 'Migrate Database'}
        </button>
        
        <button
          onClick={handleDiscovery}
          disabled={isDiscovering}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDiscovering ? 'Discovering...' : 'Discover Apps'}
        </button>
      </div>

      {migrationResult && (
        <div className={`p-4 rounded-lg ${migrationResult.includes('failed') || migrationResult.includes('error') 
          ? 'bg-red-500/20 border border-red-500' 
          : 'bg-green-500/20 border border-green-500'
        }`}>
          <h3 className="font-semibold text-white mb-2">Migration Result</h3>
          <p className="text-gray-300">{migrationResult}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Discovered Apps */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Discovered Apps ({result.discovered.length})
            </h3>
            {result.discovered.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {result.discovered.map((app) => (
                  <div key={app.slug} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{app.icon || '📱'}</span>
                      <div>
                        <h4 className="font-medium text-white">{app.name}</h4>
                        <p className="text-sm text-gray-400">{app.slug}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{app.description}</p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                        v{app.version}
                      </span>
                      {app.requires_auth && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                          Auth Required
                        </span>
                      )}
                      {app.port && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                          Port {app.port}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No apps discovered</p>
            )}
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Errors ({result.errors.length})
              </h3>
              <ul className="space-y-2">
                {result.errors.map((error, index) => (
                  <li key={index} className="text-red-300">
                    <span className="font-medium">{error.path}:</span> {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Discovery Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">{result.discovered.length}</div>
                <div className="text-sm text-gray-400">Discovered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{result.registered.length}</div>
                <div className="text-sm text-gray-400">Registered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{result.errors.length}</div>
                <div className="text-sm text-gray-400">Errors</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}