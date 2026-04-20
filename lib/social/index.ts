// Index — registry des providers + helpers haut-niveau

import type { Platform, SocialProvider } from './types';
import { instagramProvider } from './instagram';
import { tiktokProvider } from './tiktok';
import { youtubeProvider } from './youtube';

export const PROVIDERS: Record<Platform, SocialProvider> = {
  instagram: instagramProvider,
  tiktok: tiktokProvider,
  youtube: youtubeProvider,
};

export function getProvider(platform: string): SocialProvider {
  if (!(platform in PROVIDERS)) throw new Error(`Unknown platform: ${platform}`);
  return PROVIDERS[platform as Platform];
}

export type { Platform, SocialProvider, SocialMetrics, SocialVideo, ProviderProfile, OAuthTokenResult, ConnectionRow } from './types';
