// Central feature registry
import { adminFeature } from './admin/config';
import { supportChatFeature } from './support-chat/config';

export { adminFeature, supportChatFeature };

// Additional features can be imported here
// export { chatFeature } from './chat/config';
// export { appsMarketplaceFeature } from './apps-marketplace/config';
// export { userProfileFeature } from './user-profile/config';

// Main features array for iteration
export const allFeatures = [
  adminFeature,
  supportChatFeature,
  // Add other features here as they are implemented
] as const;

// Feature lookup map
export const featureMap = {
  admin_panel: adminFeature,
  support_chat: supportChatFeature,
} as const;

// Type exports
export type FeatureKey = keyof typeof featureMap;
export type Feature = typeof allFeatures[number];