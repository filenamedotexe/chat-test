import { NextRequest, NextResponse } from 'next/server';
import { featureFlags } from './feature-flags';

// Map routes to required features
export const featureRouteMap: Record<string, string> = {
  '/chat': 'chat',
  '/api/chat-langchain': 'chat',
  '/api/memory': 'chat',
  '/api/test-langchain': 'chat',
  '/apps': 'apps_marketplace',
  '/api/apps': 'apps_marketplace',
  '/api/user/apps': 'apps_marketplace',
  '/profile': 'user_profile',
  '/api/user/profile': 'user_profile',
  '/api/user/activity': 'user_profile',
  '/api/user/change-password': 'user_profile',
  '/settings': 'user_profile',
  '/api/user/settings': 'user_profile',
  '/admin': 'admin_panel',
  '/api/admin': 'admin_panel',
  '/analytics': 'analytics',
  '/api/analytics': 'analytics',
  '/api/user/settings/api-keys': 'api_keys',
};

/**
 * Check if a route requires a specific feature flag
 */
export function getRequiredFeature(pathname: string): string | null {
  // Check exact match first
  if (featureRouteMap[pathname]) {
    return featureRouteMap[pathname];
  }

  // Check prefix matches
  for (const [route, feature] of Object.entries(featureRouteMap)) {
    if (pathname.startsWith(route)) {
      return feature;
    }
  }

  return null;
}

/**
 * Create response for feature-disabled routes
 */
export function createFeatureDisabledResponse(
  request: NextRequest,
  feature: string,
  isApi: boolean
): NextResponse {
  if (isApi) {
    return NextResponse.json(
      { 
        error: 'Feature disabled',
        message: `The ${feature} feature is not available for your account`,
        feature 
      },
      { status: 403 }
    );
  }

  // For non-API routes, redirect to feature-disabled page
  const url = new URL('/feature-disabled', request.url);
  url.searchParams.set('feature', feature);
  url.searchParams.set('returnUrl', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

/**
 * Add feature flags to response headers
 */
export async function addFeatureFlagsToHeaders(
  response: NextResponse,
  userId: string | number
): Promise<NextResponse> {
  try {
    const features = await featureFlags.getUserFeatures(userId);
    response.headers.set('X-Feature-Flags', features.join(','));
  } catch (error) {
    console.error('Failed to add feature flags to headers:', error);
  }
  return response;
}