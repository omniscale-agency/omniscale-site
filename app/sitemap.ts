import type { MetadataRoute } from 'next';

const BASE = 'https://omniscale.fr';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`,                    lastModified: now, changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE}/login`,               lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE}/signup`,              lastModified: now, changeFrequency: 'yearly',  priority: 0.6 },
    { url: `${BASE}/mentions-legales`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE}/cgu`,                 lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE}/confidentialite`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ];
}
