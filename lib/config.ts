// Configuration centralisée — modifie ici les liens externes
// Lien de réservation (iClosed = formulaire de qualification + booking)
export const BOOKING_URL = 'https://app.iclosed.io/e/OMNISCALE/45min';
export const CONTACT_EMAIL = 'contact@omniscale.fr';
export const PHONE_NUMBER = '+33 7 80 95 47 83';
export const PHONE_HREF = 'tel:+33780954783';
export const INSTAGRAM_URL = 'https://www.instagram.com/omniscale.fr/';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/omniscale-agency-bb0b35405/';
export const TIKTOK_URL = 'https://www.tiktok.com/@omniscale.fr';
export const YOUTUBE_URL = 'https://www.youtube.com/@omniscale.agency';

// Trustpilot — note d'avis publique
// À mettre à jour quand le score change (ou fetch dynamique plus tard via leur API)
export const TRUSTPILOT = {
  url: 'https://fr.trustpilot.com/review/omniscale.fr',
  reviewUrl: 'https://fr.trustpilot.com/evaluate/omniscale.fr',
  rating: 4.0,
  reviewCount: 4,
  /** Label officiel Trustpilot — Excellent / Bien / Moyen / Mauvais / Médiocre */
  label: 'Bien',
} as const;

// Liste des dernières vidéos YouTube (les plus récentes en premier).
// Pour ajouter une vidéo : { id: 'YOUTUBE_VIDEO_ID', title: 'Titre' }.
// Les `null` deviendront des cards "Bientôt" si on garde une grille de N slots.
export interface YouTubeVideo {
  id: string;       // L'ID YouTube (xxx dans https://youtu.be/xxx)
  title: string;
}

export const YOUTUBE_VIDEOS: Array<YouTubeVideo | null> = [
  { id: 'UEgrx8NhuQs', title: 'Les 5 process qui font exploser ton CA (méthode Omniscale)' },
  null,
  null,
];

/** Construit l'URL de la miniature haute-déf pour un ID YouTube. */
export function youtubeThumbnail(id: string, size: 'hq' | 'maxres' = 'maxres'): string {
  return `https://i.ytimg.com/vi/${id}/${size === 'maxres' ? 'maxresdefault' : 'hqdefault'}.jpg`;
}

/** Construit l'URL de partage YouTube pour un ID. */
export function youtubeWatchUrl(id: string): string {
  return `https://youtu.be/${id}`;
}

// ============================================================
// TikTok showreel — vidéos clients réelles
// ============================================================
// Pour ajouter / retirer des vidéos : édite ce tableau.
// `src` pointe vers une vidéo dans /public/videos/showreel (auto-play
// dans la marquee + modale en grand au clic).
// `thumbnail` (poster) pointe vers une image dans /public/images/showreel.
// `url` est l'URL TikTok publique (utilisé pour le bouton "Voir sur TikTok"
// dans la modale, et pour le crédit auteur).
export interface TikTokVideo {
  src: string;
  thumbnail: string;
  url: string;
  author: string;        // nom du compte / marque (affiché en haut de la card)
  title: string;         // caption / accroche (affiché en bas)
  category?: string;     // facultatif : "TikTok viral", "Pub Meta", etc.
}

export const TIKTOK_VIDEOS: TikTokVideo[] = [
  {
    url: 'https://www.tiktok.com/@ocroustipoulet/video/7626793485940673814',
    src: '/videos/showreel/tt-0.mp4',
    thumbnail: '/images/showreel/tt-0.jpg',
    author: "O'Crousti Poulet",
    title: 'Alerte générale — menus solo à 2€',
    category: 'TikTok viral',
  },
  {
    url: 'https://www.tiktok.com/@frenchretailersmen/video/7617108532713852182',
    src: '/videos/showreel/tt-1.mp4',
    thumbnail: '/images/showreel/tt-1.jpg',
    author: 'French Retailers Men',
    title: 'Va-t-il trouver le juste prix ?',
    category: 'TikTok viral',
  },
  {
    url: 'https://www.tiktok.com/@frenchretailersmen/video/7613839046338546967',
    src: '/videos/showreel/tt-2.mp4',
    thumbnail: '/images/showreel/tt-2.jpg',
    author: 'French Retailers Men',
    title: 'Loupé...',
    category: 'TikTok',
  },
  {
    url: 'https://www.tiktok.com/@frenchretailersmen/video/7611976991528750358',
    src: '/videos/showreel/tt-3.mp4',
    thumbnail: '/images/showreel/tt-3.jpg',
    author: 'French Retailers Men',
    title: 'Je ressors en bénef',
    category: 'TikTok',
  },
  {
    url: 'https://www.tiktok.com/@turbopneus/video/7502490035443207446',
    src: '/videos/showreel/tt-4.mp4',
    thumbnail: '/images/showreel/tt-4.jpg',
    author: 'Turbo Pneus',
    title: 'En amont 2800€, en aval 2000 balles',
    category: 'Garage / Auto',
  },
  {
    url: 'https://www.tiktok.com/@frenchretailersmen/video/7624634414185647382',
    src: '/videos/showreel/tt-5.mp4',
    thumbnail: '/images/showreel/tt-5.jpg',
    author: 'French Retailers Men',
    title: 'Va-t-il réussir à faire sa tenue ?',
    category: 'TikTok viral',
  },
  {
    url: 'https://www.tiktok.com/@mira.activewear/video/7627919114828369174',
    src: '/videos/showreel/tt-6.mp4',
    thumbnail: '/images/showreel/tt-6.jpg',
    author: 'MIRA Activewear',
    title: 'MIRA × Mercedes-Benz — Pilates',
    category: 'Event activewear',
  },
  {
    url: 'https://www.tiktok.com/@sashasouthside/video/7568164849876765974',
    src: '/videos/showreel/tt-7.mp4',
    thumbnail: '/images/showreel/tt-7.jpg',
    author: 'Sasha Southside',
    title: 'Mon client est venu pour tout couper',
    category: 'Coiffeur',
  },
  {
    url: 'https://www.tiktok.com/@frenchretailersmen/video/7628662333577039127',
    src: '/videos/showreel/tt-8.mp4',
    thumbnail: '/images/showreel/tt-8.jpg',
    author: 'French Retailers Men',
    title: '@coachella where is the invitation ?',
    category: 'TikTok viral',
  },
  {
    url: 'https://www.tiktok.com/@frenchretailersmen/video/7629449624524295446',
    src: '/videos/showreel/tt-9.mp4',
    thumbnail: '/images/showreel/tt-9.jpg',
    author: 'French Retailers Men',
    title: 'Prépare avec nous une commande client',
    category: 'Behind the scenes',
  },
  {
    url: 'https://www.tiktok.com/@frenchretailersmen/video/7621541292060806422',
    src: '/videos/showreel/tt-10.mp4',
    thumbnail: '/images/showreel/tt-10.jpg',
    author: 'French Retailers Men',
    title: 'Grande braderie du 26 au 29 mars',
    category: 'Event boutique',
  },
  {
    url: 'https://www.tiktok.com/@karamelculture/video/7622371565337840918',
    src: '/videos/showreel/tt-11.mp4',
    thumbnail: '/images/showreel/tt-11.jpg',
    author: 'Karamel Culture',
    title: 'Tag French Retailers Men 🤍',
    category: 'UGC / Influence',
  },
];
