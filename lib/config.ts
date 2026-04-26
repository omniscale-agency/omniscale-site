// Configuration centralisée — modifie ici les liens externes
// Lien de réservation (iClosed = formulaire de qualification + booking)
export const BOOKING_URL = 'https://app.iclosed.io/e/OMNISCALE/45min';
export const CONTACT_EMAIL = 'contact@omniscale.fr';
export const PHONE_NUMBER = '+33 7 80 95 47 83';
export const PHONE_HREF = 'tel:+33780954783';
export const INSTAGRAM_URL = 'https://instagram.com/omniscale';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/omniscale-agency-bb0b35405/';
export const TIKTOK_URL = 'https://www.tiktok.com/@omniscale.fr';
export const YOUTUBE_URL = 'https://www.youtube.com/@omniscale.agency';

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
