// Types partagés entre les providers sociaux (Instagram, TikTok, YouTube)

export type Platform = 'instagram' | 'tiktok' | 'youtube';

export interface SocialMetrics {
  followers: number;
  following?: number;
  totalLikes?: number;
  totalViews?: number;
  videoCount?: number;
  postCount?: number;
  // Optionnel : périodique
  views30d?: number;
  reach30d?: number;
  impressions30d?: number;
  profileViews30d?: number;
  followersGained30d?: number;
  engagementRate?: number;
}

export interface SocialVideo {
  externalId: string;
  title?: string;
  thumbnailUrl?: string;
  permalink?: string;
  publishedAt?: string; // ISO
  views: number;
  likes: number;
  comments: number;
  shares: number;
  raw?: Record<string, any>;
}

export interface ConnectionRow {
  id: string;
  user_id: string;
  platform: Platform;
  username: string;
  followers: number;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  provider_user_id: string | null;
  scope: string | null;
  metrics_cache: SocialMetrics;
  last_synced_at: string | null;
  avatar_url: string | null;
  connected_at: string;
}

export interface OAuthTokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string; // ISO
  scope?: string;
}

export interface ProviderProfile {
  providerUserId: string;
  username: string;
  avatarUrl?: string;
  metrics: SocialMetrics;
}

/** Interface qu'implémente chaque provider (instagram.ts, tiktok.ts, youtube.ts) */
export interface SocialProvider {
  platform: Platform;

  /** Construit l'URL d'autorisation OAuth à laquelle on redirige l'utilisateur */
  buildAuthUrl(state: string, redirectUri: string): string;

  /** Échange le code OAuth contre des tokens */
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokenResult>;

  /** Optionnel : refresh le token si expiré */
  refreshAccessToken?(refreshToken: string): Promise<OAuthTokenResult>;

  /** Récupère le profil + metrics globales */
  fetchProfile(accessToken: string, providerUserId?: string): Promise<ProviderProfile>;

  /** Récupère les N dernières vidéos / posts */
  fetchRecentVideos(accessToken: string, providerUserId?: string, limit?: number): Promise<SocialVideo[]>;
}
