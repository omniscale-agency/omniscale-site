// Données mock pour les dashboards. À remplacer par des vraies API plus tard.

export interface ClientData {
  slug: string;
  name: string;
  brand: string;
  sector: string;
  city: string;
  joinedAt: string;
  contact: { name: string; email: string; phone: string };
  closer: string;
  monthlyRevenue: string;
  status: 'actif' | 'pause' | 'onboarding';

  // Stats 30 derniers jours
  stats: {
    instagramViews: number;
    instagramFollowers: number;
    instagramFollowersGained: number;
    tiktokViews: number;
    tiktokFollowers: number;
    tiktokFollowersGained: number;
    engagementRate: number; // %
    postsPublished: number;
    adSpend: number; // €
    adRevenue: number; // €
    newCustomers: number;
  };

  // Objectifs
  objectives: Array<{
    label: string;
    current: number;
    target: number;
    unit: string;
  }>;

  // Todolist (tâches en cours)
  todos: Array<{
    id: string;
    title: string;
    done: boolean;
    dueDate?: string;
    assignee?: string;
    priority?: 'low' | 'med' | 'high';
  }>;

  // Vidéos publiées récemment
  videos: Array<{
    id: string;
    title: string;
    platform: 'instagram' | 'tiktok' | 'youtube';
    publishedAt: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    thumbnail?: string;
  }>;

  // Prochains rendez-vous Google Calendar (mock)
  upcomingEvents: Array<{
    id: string;
    title: string;
    startsAt: string;
    duration: number; // minutes
    type: 'call' | 'shooting' | 'review' | 'workshop';
    with: string;
  }>;

  // Activité récente (timeline)
  activity: Array<{
    id: string;
    type: 'video_posted' | 'campaign_launched' | 'milestone' | 'note';
    label: string;
    at: string;
  }>;
}

export const CLIENTS: ClientData[] = [
  {
    slug: 'maison-lea',
    name: 'Léa M.',
    brand: 'Maison Léa',
    sector: 'Boutique de mode',
    city: 'Lyon',
    joinedAt: '2025-10-15',
    contact: { name: 'Léa Martin', email: 'lea@maisonlea.fr', phone: '+33 6 12 34 56 78' },
    closer: 'Antoine',
    monthlyRevenue: '45 000 €',
    status: 'actif',
    stats: {
      instagramViews: 487320,
      instagramFollowers: 28450,
      instagramFollowersGained: 1842,
      tiktokViews: 1240560,
      tiktokFollowers: 14230,
      tiktokFollowersGained: 3210,
      engagementRate: 6.4,
      postsPublished: 24,
      adSpend: 3200,
      adRevenue: 18450,
      newCustomers: 142,
    },
    objectives: [
      { label: 'CA mensuel', current: 45000, target: 60000, unit: '€' },
      { label: 'Abonnés Insta', current: 28450, target: 35000, unit: '' },
      { label: 'Posts publiés / mois', current: 24, target: 30, unit: '' },
      { label: 'ROAS Meta', current: 5.7, target: 6, unit: 'x' },
    ],
    todos: [
      { id: 't1', title: 'Valider le brief shooting collection printemps', done: false, dueDate: '2026-04-22', assignee: 'Antoine', priority: 'high' },
      { id: 't2', title: 'Approuver les 3 visuels de la campagne Meta', done: false, dueDate: '2026-04-19', assignee: 'Léa', priority: 'high' },
      { id: 't3', title: 'Envoyer la liste des nouveautés pour le mois', done: false, dueDate: '2026-04-25', assignee: 'Léa', priority: 'med' },
      { id: 't4', title: 'Caler un créneau influence avec @sophie_paris', done: true, assignee: 'Antoine', priority: 'med' },
      { id: 't5', title: 'Préparer les codes promo pour les soldes', done: true, assignee: 'Antoine' },
      { id: 't6', title: 'Mettre à jour le pixel Meta sur le site', done: true, assignee: 'Antoine' },
    ],
    videos: [
      { id: 'v1', title: 'Try-on collection printemps 2026', platform: 'tiktok', publishedAt: '2026-04-15', views: 142800, likes: 8420, comments: 312, shares: 1240 },
      { id: 'v2', title: 'Behind the scenes du shooting', platform: 'instagram', publishedAt: '2026-04-13', views: 67300, likes: 3120, comments: 184, shares: 240 },
      { id: 'v3', title: 'Get ready with me — soirée', platform: 'tiktok', publishedAt: '2026-04-11', views: 320400, likes: 18200, comments: 845, shares: 4500 },
      { id: 'v4', title: 'Nouveauté : la robe lin', platform: 'instagram', publishedAt: '2026-04-09', views: 42100, likes: 2840, comments: 96, shares: 180 },
      { id: 'v5', title: 'Visite de la boutique', platform: 'youtube', publishedAt: '2026-04-05', views: 12400, likes: 720, comments: 48, shares: 32 },
      { id: 'v6', title: 'Look du jour — denim', platform: 'instagram', publishedAt: '2026-04-03', views: 38900, likes: 2410, comments: 78, shares: 140 },
    ],
    upcomingEvents: [
      { id: 'e1', title: 'Point hebdo stratégie', startsAt: '2026-04-21T14:00:00.000Z', duration: 45, type: 'call', with: 'Antoine + Sarah' },
      { id: 'e2', title: 'Shooting collection printemps', startsAt: '2026-04-23T09:00:00.000Z', duration: 240, type: 'shooting', with: 'Équipe production' },
      { id: 'e3', title: 'Review campagnes Meta', startsAt: '2026-04-25T11:00:00.000Z', duration: 30, type: 'review', with: 'Antoine' },
      { id: 'e4', title: 'Atelier contenu UGC', startsAt: '2026-04-28T15:00:00.000Z', duration: 90, type: 'workshop', with: 'Sarah' },
    ],
    activity: [
      { id: 'a1', type: 'video_posted', label: 'Nouvelle vidéo TikTok publiée — 142k vues en 48h', at: '2026-04-15T18:00:00.000Z' },
      { id: 'a2', type: 'campaign_launched', label: 'Campagne Meta "Printemps 2026" lancée — 1 200€/jour', at: '2026-04-14T10:00:00.000Z' },
      { id: 'a3', type: 'milestone', label: '🎉 Cap des 28k abonnés Insta franchi !', at: '2026-04-12T09:00:00.000Z' },
      { id: 'a4', type: 'note', label: 'Antoine : "Performance des Reels +40% cette semaine"', at: '2026-04-10T16:30:00.000Z' },
      { id: 'a5', type: 'video_posted', label: 'Reel "Behind the scenes" publié', at: '2026-04-13T12:00:00.000Z' },
    ],
  },
  {
    slug: 'trattoria-sole',
    name: 'Marco D.',
    brand: 'Trattoria Sole',
    sector: 'Restaurant italien',
    city: 'Paris',
    joinedAt: '2025-12-01',
    contact: { name: 'Marco De Luca', email: 'marco@trattoriasole.fr', phone: '+33 6 87 65 43 21' },
    closer: 'Antoine',
    monthlyRevenue: '78 000 €',
    status: 'actif',
    stats: {
      instagramViews: 312800,
      instagramFollowers: 18900,
      instagramFollowersGained: 2340,
      tiktokViews: 890400,
      tiktokFollowers: 9870,
      tiktokFollowersGained: 1820,
      engagementRate: 8.1,
      postsPublished: 18,
      adSpend: 1800,
      adRevenue: 9200,
      newCustomers: 87,
    },
    objectives: [
      { label: 'Couverts / semaine', current: 380, target: 450, unit: '' },
      { label: 'Abonnés Insta', current: 18900, target: 25000, unit: '' },
      { label: 'Réservations en ligne', current: 64, target: 80, unit: '%' },
    ],
    todos: [
      { id: 't1', title: 'Filmer la nouvelle carte de printemps', done: false, dueDate: '2026-04-20', assignee: 'Sarah', priority: 'high' },
      { id: 't2', title: 'Activer la campagne pour la fête des mères', done: false, dueDate: '2026-04-30', assignee: 'Antoine', priority: 'med' },
      { id: 't3', title: 'Valider le partenariat avec @paris_food', done: true, assignee: 'Antoine' },
    ],
    videos: [
      { id: 'v1', title: 'Préparation des pâtes fraîches maison', platform: 'tiktok', publishedAt: '2026-04-14', views: 220400, likes: 14200, comments: 580, shares: 2400 },
      { id: 'v2', title: 'Tiramisu en 60 secondes', platform: 'instagram', publishedAt: '2026-04-12', views: 89400, likes: 4820, comments: 245, shares: 380 },
      { id: 'v3', title: 'Marco présente la carte', platform: 'youtube', publishedAt: '2026-04-08', views: 18200, likes: 920, comments: 64, shares: 48 },
    ],
    upcomingEvents: [
      { id: 'e1', title: 'Point mensuel performance', startsAt: '2026-04-22T16:00:00.000Z', duration: 60, type: 'call', with: 'Antoine' },
      { id: 'e2', title: 'Shooting carte printemps', startsAt: '2026-04-26T14:00:00.000Z', duration: 180, type: 'shooting', with: 'Sarah' },
    ],
    activity: [
      { id: 'a1', type: 'milestone', label: '🎉 1ère vidéo TikTok à dépasser 200k vues', at: '2026-04-14T20:00:00.000Z' },
      { id: 'a2', type: 'video_posted', label: 'Reel "Tiramisu express" publié', at: '2026-04-12T11:30:00.000Z' },
    ],
  },
  {
    slug: 'glow-cosmetics',
    name: 'Camille R.',
    brand: 'Glow Cosmetics',
    sector: 'E-commerce beauté',
    city: 'Bordeaux',
    joinedAt: '2026-01-20',
    contact: { name: 'Camille Roux', email: 'camille@glowcosmetics.com', phone: '+33 6 56 78 90 12' },
    closer: 'Sarah',
    monthlyRevenue: '120 000 €',
    status: 'actif',
    stats: {
      instagramViews: 920400,
      instagramFollowers: 54200,
      instagramFollowersGained: 4820,
      tiktokViews: 2340800,
      tiktokFollowers: 38900,
      tiktokFollowersGained: 6420,
      engagementRate: 5.2,
      postsPublished: 32,
      adSpend: 12400,
      adRevenue: 79360,
      newCustomers: 412,
    },
    objectives: [
      { label: 'CA mensuel', current: 120000, target: 200000, unit: '€' },
      { label: 'ROAS Meta', current: 6.4, target: 7, unit: 'x' },
      { label: 'Abonnés cumulés', current: 93100, target: 150000, unit: '' },
      { label: 'Taux de conversion site', current: 3.2, target: 4.5, unit: '%' },
    ],
    todos: [
      { id: 't1', title: 'Valider la nouvelle landing page hydratant', done: false, dueDate: '2026-04-19', assignee: 'Sarah', priority: 'high' },
      { id: 't2', title: 'Setup email automation post-achat', done: false, dueDate: '2026-04-26', assignee: 'Antoine', priority: 'med' },
      { id: 't3', title: 'Brief les 5 micro-influenceuses sélectionnées', done: false, dueDate: '2026-04-22', assignee: 'Sarah', priority: 'high' },
      { id: 't4', title: 'Tester nouveaux creatives Meta (3 hooks)', done: true, assignee: 'Antoine' },
    ],
    videos: [
      { id: 'v1', title: 'Routine soir — résultats avant/après', platform: 'tiktok', publishedAt: '2026-04-15', views: 580400, likes: 38200, comments: 1840, shares: 7200 },
      { id: 'v2', title: 'Test produit avec dermato', platform: 'youtube', publishedAt: '2026-04-12', views: 124800, likes: 8420, comments: 540, shares: 320 },
      { id: 'v3', title: 'Unboxing de la nouvelle gamme', platform: 'instagram', publishedAt: '2026-04-10', views: 142800, likes: 9420, comments: 384, shares: 720 },
    ],
    upcomingEvents: [
      { id: 'e1', title: 'Strategy call hebdo', startsAt: '2026-04-19T10:00:00.000Z', duration: 60, type: 'call', with: 'Sarah + Antoine' },
      { id: 'e2', title: 'Workshop CRO sur le site', startsAt: '2026-04-24T14:00:00.000Z', duration: 120, type: 'workshop', with: 'Sarah' },
    ],
    activity: [
      { id: 'a1', type: 'milestone', label: '🚀 ROAS Meta passé de 4.8 à 6.4 ce mois', at: '2026-04-15T09:00:00.000Z' },
      { id: 'a2', type: 'campaign_launched', label: 'Campagne TikTok Spark Ads lancée — 800€/jour', at: '2026-04-13T11:00:00.000Z' },
      { id: 'a3', type: 'video_posted', label: 'Vidéo dermato YouTube publiée', at: '2026-04-12T15:00:00.000Z' },
    ],
  },
];

export function getClientBySlug(slug: string): ClientData | undefined {
  return CLIENTS.find((c) => c.slug === slug);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'k';
  return n.toString();
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
