'use client';

import { useState, useEffect } from 'react';
import { IconToggleLeft, IconToggleRight, IconDeviceFloppy, IconRefresh } from '@tabler/icons-react';

interface FeatureFlag {
  feature_key: string;
  display_name: string;
  description: string;
  default_enabled: boolean;
}

interface UserFeatureOverride {
  feature_key: string;
  enabled: boolean;
  enabled_at: string;
}

interface UserFeatureOverridesProps {
  userId: number;
}

export default function UserFeatureOverrides({ userId }: UserFeatureOverridesProps) {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [userOverrides, setUserOverrides] = useState<UserFeatureOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch all features
      const featuresRes = await fetch('/api/features/all');
      if (featuresRes.ok) {
        const featuresData = await featuresRes.json();
        setFeatures(featuresData);
      }

      // Fetch user's feature overrides
      const overridesRes = await fetch(`/api/features/user/${userId}/overrides`);
      if (overridesRes.ok) {
        const overridesData = await overridesRes.json();
        setUserOverrides(overridesData);
      }
    } catch (error) {
      console.error('Error fetching feature data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (featureKey: string, currentValue: boolean) => {
    const newChanges = {
      ...changes,
      [featureKey]: !currentValue
    };
    setChanges(newChanges);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/features/user/${userId}/overrides`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: changes })
      });

      if (response.ok) {
        // Reset changes and refresh data
        setChanges({});
        await fetchData();
      }
    } catch (error) {
      console.error('Error saving overrides:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setChanges({});
  };

  const getFeatureStatus = (featureKey: string) => {
    // Check if there's a pending change
    if (featureKey in changes) {
      return changes[featureKey];
    }
    
    // Check if there's an existing override
    const override = userOverrides.find(o => o.feature_key === featureKey);
    if (override) {
      return override.enabled;
    }
    
    // Fall back to default
    const feature = features.find(f => f.feature_key === featureKey);
    return feature?.default_enabled || false;
  };

  const hasOverride = (featureKey: string) => {
    return userOverrides.some(o => o.feature_key === featureKey) || featureKey in changes;
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-8 bg-gray-700 rounded"></div>
          <div className="h-8 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Feature Overrides</h3>
        {Object.keys(changes).length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-1.5 min-h-[36px]"
            >
              <IconRefresh className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1.5 min-h-[36px] disabled:opacity-50"
            >
              <IconDeviceFloppy className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {features.map((feature) => {
          const isEnabled = getFeatureStatus(feature.feature_key);
          const isOverridden = hasOverride(feature.feature_key);
          const hasChange = feature.feature_key in changes;
          
          return (
            <div
              key={feature.feature_key}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                hasChange
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : isOverridden
                  ? 'border-blue-500/30 bg-blue-500/5'
                  : 'border-gray-800 bg-gray-900/30'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white">
                    {feature.display_name}
                  </h4>
                  {isOverridden && !hasChange && (
                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                      Override
                    </span>
                  )}
                  {hasChange && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                      Modified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {feature.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Default: {feature.default_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              
              <button
                onClick={() => handleToggle(feature.feature_key, isEnabled)}
                className={`p-2 rounded-lg transition-all ${
                  isEnabled
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                }`}
                title={isEnabled ? 'Click to disable' : 'Click to enable'}
              >
                {isEnabled ? (
                  <IconToggleRight className="w-5 h-5" />
                ) : (
                  <IconToggleLeft className="w-5 h-5" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>• Overrides take precedence over default feature settings</p>
        <p>• User will see these features regardless of global settings</p>
      </div>
    </div>
  );
}