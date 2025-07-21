"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { IconBeta, IconFlask, IconCheck } from "@tabler/icons-react";

interface FeatureFlag {
  feature_key: string;
  display_name: string;
  description: string;
  default_enabled: boolean;
}

interface UserFeatureGroup {
  group_key: string;
  display_name: string;
  description: string;
  joined_at: string;
}

export default function FeatureSettings() {
  const { data: session } = useSession();
  const [features, setFeatures] = useState<string[]>([]);
  const [allFeatures, setAllFeatures] = useState<FeatureFlag[]>([]);
  const [userGroups, setUserGroups] = useState<UserFeatureGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch features with user-specific enabled status
      const response = await fetch('/api/features/list');
      
      if (response.ok) {
        const data = await response.json();
        setAllFeatures(data);
        
        // Extract enabled features
        const enabledFeatures = data
          .filter((f: any) => f.is_enabled)
          .map((f: any) => f.feature_key);
        setFeatures(enabledFeatures);
      } else {
        console.error('Failed to fetch features:', response.status);
      }

      // TODO: Add API endpoint for user feature groups
      // const groupsRes = await fetch('/api/features/user-groups');
      // if (groupsRes.ok) {
      //   const data = await groupsRes.json();
      //   setUserGroups(data);
      // }
    } catch (error) {
      console.error('Error fetching feature data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBetaOptIn = async () => {
    // TODO: Implement beta opt-in API
    alert('Beta opt-in coming soon!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enabled Features */}
      <div className="theme-card p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Enabled Features</h2>
        <p className="text-gray-400 text-sm mb-6">
          These features are currently available to you based on your account settings and permissions.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allFeatures.map((feature: any) => {
            const isEnabled = feature.is_enabled;
            return (
              <motion.div
                key={feature.feature_key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  isEnabled 
                    ? 'border-purple-500/30 bg-purple-500/10' 
                    : 'border-gray-800 bg-gray-900/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      isEnabled ? 'text-white' : 'text-gray-400'
                    }`}>
                      {feature.display_name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {feature.description}
                    </p>
                  </div>
                  {isEnabled && (
                    <IconCheck className="w-5 h-5 text-green-500 ml-3 flex-shrink-0" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Beta Programs */}
      <div className="theme-card p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <IconFlask className="w-6 h-6 text-purple-400" />
          <h2 className="text-lg sm:text-xl font-semibold">Beta Programs</h2>
        </div>
        
        <p className="text-gray-400 text-sm mb-6">
          Join beta programs to get early access to new features and help us improve the platform.
        </p>

        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30">
          <div className="flex items-start gap-4">
            <IconBeta className="w-8 h-8 text-purple-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Early Access Program</h3>
              <p className="text-gray-300 text-sm mb-4">
                Get access to experimental features before they're released to everyone. 
                Help shape the future of our platform by providing feedback.
              </p>
              <button
                onClick={handleBetaOptIn}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px]"
              >
                Join Beta Program
              </button>
            </div>
          </div>
        </div>

        {/* User's Beta Groups */}
        {userGroups.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-300 mb-3">Your Beta Programs</h3>
            <div className="space-y-2">
              {userGroups.map((group) => (
                <div key={group.group_key} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div>
                    <p className="font-medium text-white">{group.display_name}</p>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(group.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feature Requests */}
      <div className="theme-card p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Feature Requests</h2>
        <p className="text-gray-400 text-sm mb-4">
          Have an idea for a new feature? Let us know what would make your experience better.
        </p>
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px]">
          Submit Feature Request
        </button>
      </div>
    </div>
  );
}