'use client';

import { useSession } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  IconToggleLeft, 
  IconToggleRight,
  IconUsers,
  IconPercentage,
  IconCheck,
  IconX,
  IconEdit,
  IconDeviceFloppy
} from '@tabler/icons-react';

interface FeatureFlag {
  id: number;
  feature_key: string;
  display_name: string;
  description: string;
  default_enabled: boolean;
  rollout_percentage: number;
  created_at: string;
  updated_at: string;
}

export default function FeatureManagementPage() {
  const { data: session } = useSession();
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<FeatureFlag>>({});

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchFeatures();
    }
  }, [isAdmin]);

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/features/all');
      if (response.ok) {
        const data = await response.json();
        setFeatures(data);
      }
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (featureKey: string, currentEnabled: boolean) => {
    try {
      const response = await fetch(`/api/features/config/${featureKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_enabled: !currentEnabled })
      });

      if (response.ok) {
        const updatedFeatures = features.map((f: FeatureFlag) => 
          f.feature_key === featureKey 
            ? { ...f, default_enabled: !currentEnabled }
            : f
        );
        setFeatures(updatedFeatures);
      }
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  const handleEdit = (feature: FeatureFlag) => {
    setEditingId(feature.id);
    setEditValues({
      display_name: feature.display_name,
      description: feature.description,
      rollout_percentage: feature.rollout_percentage
    });
  };

  const handleSave = async (featureKey: string) => {
    try {
      const response = await fetch(`/api/features/config/${featureKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues)
      });

      if (response.ok) {
        const updatedFeatures = features.map((f: FeatureFlag) => 
          f.feature_key === featureKey 
            ? { ...f, ...editValues }
            : f
        );
        setFeatures(updatedFeatures);
        setEditingId(null);
        setEditValues({});
      }
    } catch (error) {
      console.error('Error updating feature:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">Access Denied</h1>
          <p className="text-gray-400 mt-2">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-32 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Feature Flag Management</h1>
          <p className="text-gray-400 mt-2">Control feature rollouts and availability</p>
        </motion.div>

        <div className="space-y-4">
          {features.map((feature, index) => {
            const isEditing = editingId === feature.id;
            
            return (
              <motion.div
                key={feature.feature_key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-xl border border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValues.display_name}
                        onChange={(e) => setEditValues({ ...editValues, display_name: e.target.value })}
                        className="text-xl font-semibold bg-gray-700 text-white px-3 py-1 rounded mb-2"
                      />
                    ) : (
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {feature.display_name}
                      </h3>
                    )}
                    
                    {isEditing ? (
                      <textarea
                        value={editValues.description}
                        onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                        className="text-gray-400 bg-gray-700 text-sm px-3 py-1 rounded mb-4 w-full"
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-400 text-sm mb-4">{feature.description}</p>
                    )}

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <code className="text-purple-400 bg-gray-900 px-2 py-1 rounded text-xs">
                          {feature.feature_key}
                        </code>
                      </div>

                      <div className="flex items-center gap-2">
                        <IconPercentage className="w-4 h-4 text-gray-500" />
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editValues.rollout_percentage}
                            onChange={(e) => setEditValues({ 
                              ...editValues, 
                              rollout_percentage: parseInt(e.target.value) || 0 
                            })}
                            className="text-sm bg-gray-700 text-gray-300 px-2 py-1 rounded w-16"
                          />
                        ) : (
                          <span className="text-sm text-gray-300">
                            {feature.rollout_percentage}% rollout
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <IconUsers className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-300">
                          {feature.default_enabled ? 'Enabled by default' : 'Disabled by default'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(feature.feature_key)}
                          className="p-2 text-green-400 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Save"
                        >
                          <IconDeviceFloppy className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <IconX className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(feature)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <IconEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleToggle(feature.feature_key, feature.default_enabled)}
                          className={`p-2 rounded-lg transition-colors ${
                            feature.default_enabled
                              ? 'text-green-400 hover:bg-gray-700'
                              : 'text-gray-400 hover:bg-gray-700'
                          }`}
                          title={feature.default_enabled ? 'Disable' : 'Enable'}
                        >
                          {feature.default_enabled ? (
                            <IconToggleRight className="w-6 h-6" />
                          ) : (
                            <IconToggleLeft className="w-6 h-6" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gray-800/50 rounded-xl border border-gray-700 p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Feature Flag Information</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p>• <strong>Default Enabled:</strong> Whether the feature is enabled for all users by default</p>
            <p>• <strong>Rollout Percentage:</strong> Percentage of users who will see the feature (if enabled)</p>
            <p>• <strong>User Overrides:</strong> Individual users can have features explicitly enabled/disabled</p>
            <p>• <strong>Changes:</strong> Take effect immediately for new sessions</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}