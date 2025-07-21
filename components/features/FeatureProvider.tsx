'use client';

import { createContext, useContext, ReactNode } from 'react';

interface FeatureContextType {
  features: string[];
}

const FeatureContext = createContext<FeatureContextType>({ features: [] });

export function FeatureProvider({ 
  children, 
  features 
}: { 
  children: ReactNode; 
  features: string[] 
}) {
  return (
    <FeatureContext.Provider value={{ features }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatures() {
  return useContext(FeatureContext);
}

export function useHasFeature(feature: string): boolean {
  const { features } = useFeatures();
  return features.includes(feature);
}