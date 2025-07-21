'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export interface FeatureFlagsContextType {
  features: string[];
  loading: boolean;
  checkFeature: (featureKey: string) => boolean;
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureFlag(featureKey: string): boolean {
  const { features } = useFeatureFlags();
  return features.includes(featureKey);
}

/**
 * Hook to get all enabled features for the current user
 */
export function useFeatureFlags(): { features: string[], loading: boolean } {
  const { data: session } = useSession();
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatures() {
      if (!session?.user?.id) {
        setFeatures([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/features/user-features');
        if (response.ok) {
          const data = await response.json();
          setFeatures(data.features || []);
        } else {
          setFeatures([]);
        }
      } catch (error) {
        console.error('Error fetching feature flags:', error);
        setFeatures([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFeatures();
  }, [session?.user?.id]);

  return { features, loading };
}

/**
 * Hook to get feature configuration (admin only)
 */
export function useFeatureConfig(featureKey: string) {
  const { data: session } = useSession();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      if (!session?.user?.role || session.user.role !== 'admin') {
        setConfig(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/features/config/${featureKey}`);
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Error fetching feature config:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [featureKey, session?.user?.role]);

  return { config, loading };
}

/**
 * Hook to get all features (admin only)
 */
export function useAllFeatures() {
  const { data: session } = useSession();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllFeatures() {
      if (!session?.user?.role || session.user.role !== 'admin') {
        setFeatures([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/features/all');
        if (response.ok) {
          const data = await response.json();
          setFeatures(data.features || []);
        }
      } catch (error) {
        console.error('Error fetching all features:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllFeatures();
  }, [session?.user?.role]);

  return { features, loading };
}