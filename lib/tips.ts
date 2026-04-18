// Conseils scaling — accessibles aux leads ET aux clients.
// Contenu original Omniscale.

export interface Tip {
  id: string;
  category: 'social' | 'ads' | 'site' | 'influence' | 'sales';
  title: string;
  excerpt: string;
  body: string[];
  readMinutes: number;
  premium?: boolean;
}

export const TIPS: Tip[] = [
  {
    id: 'reels-hook-3s',
    category: 'social',
    title: 'Les 3 premières secondes d\'un Reel font 80% du résultat',
    excerpt: 'Notre framework du hook visuel + sonore + textuel pour capter avant que le pouce scrolle.',
    readMinutes: 4,
    body: [
      'Sur Reels et TikTok, l\'algorithme évalue la rétention dès la première seconde. Si tu perds le viewer avant 3s, ta vidéo ne sortira pas du cocon initial.',
      'Le hook efficace combine 3 couches : un visuel inattendu (mouvement, contraste, gros plan), un son qui interpelle (silence cassé, voix énergique), et un texte court qui pose une promesse claire.',
      'Notre règle : si tu peux résumer le bénéfice de la vidéo en 4 mots à l\'écran avant 1.5s, tu doubles tes chances de retenir le viewer.',
      'Test à faire dès cette semaine : reprend tes 3 derniers Reels et coupe la première seconde. Compare le pic de rétention sur les 14 jours.',
    ],
  },
  {
    id: 'tiktok-cta',
    category: 'social',
    title: 'Pourquoi les CTA classiques tuent ta portée TikTok',
    excerpt: '"Lien en bio" et "abonne-toi" envoient un signal négatif à l\'algo. Voici quoi dire à la place.',
    readMinutes: 3,
    body: [
      'TikTok détecte les CTA explicites comme du contenu commercial et réduit la portée organique. C\'est mesurable : on observe en moyenne -30% de vues sur les vidéos qui contiennent "abonne-toi" en outro.',
      'À la place, intègre l\'incitation dans la mécanique de la vidéo : pose une question qui appelle un commentaire, lance un cliffhanger qui se résout en partie 2, ou propose un test perso.',
      'Le vrai CTA scalable c\'est la curiosité, pas l\'injonction.',
    ],
  },
  {
    id: 'meta-creative-3-1-1',
    category: 'ads',
    title: 'La règle 3-1-1 pour ne plus jamais avoir de fatigue créa sur Meta',
    excerpt: 'Combien de creatives produire par semaine, et comment les rotater sans casser ton ROAS.',
    readMinutes: 5,
    body: [
      'Notre ratio testé sur 40+ comptes Meta : 3 nouveaux creatives par semaine, 1 retravaillé depuis un winner précédent, 1 testé sur un nouvel angle.',
      'Lance les 3 nouveaux dans un campagne ABO séparée avec budget low-touch (50€/jour). Tu gardes la campagne CBO principale clean avec uniquement les winners.',
      'Quand un creative atteint 1000 impressions sans clic ou un CPA > 1.5x ta cible : kill sans état d\'âme.',
    ],
  },
  {
    id: 'cro-fast-wins',
    category: 'site',
    title: '5 quick wins CRO pour un site e-commerce qui convertit mal',
    excerpt: 'Les changements à implémenter en 1 journée pour gagner 0.5 à 1.5 point de conversion.',
    readMinutes: 6,
    body: [
      '1. Ajoute un sticky bar de réassurance en haut du site (livraison, retour, paiement).',
      '2. Active le paiement express en haut du panier (Apple Pay / Shop Pay) — souvent +20% de conversion mobile.',
      '3. Remplace les photos statiques par des micro-vidéos en boucle sur tes 5 best-sellers.',
      '4. Affiche le stock restant ("Plus que 3 en stock") sur les pages produit.',
      '5. Sur le formulaire de checkout, retire tout champ non strictement nécessaire — chaque champ supprimé = +2-5% de conversion.',
    ],
  },
  {
    id: 'micro-influence-roi',
    category: 'influence',
    title: 'Pourquoi 10 micro-influenceurs valent mieux qu\'un macro',
    excerpt: 'Notre méthode pour identifier, briefer et tracker une vague d\'influence rentable.',
    readMinutes: 5,
    body: [
      'Un macro à 200k abonnés coûte en moyenne 4-8k€ pour un post. Pour le même budget, tu peux briefer 10 à 15 micro-influenceurs (10k-30k abonnés) avec des taux d\'engagement 3 à 5x supérieurs.',
      'Le tracking se fait via codes promo individualisés et liens UTM. Ça te donne une vraie attribution par créateur, pas une vague estimation.',
      'Bonus : tu récupères 10+ pièces de contenu UGC que tu peux re-publier ensuite en ads.',
    ],
  },
  {
    id: 'closing-objection',
    category: 'sales',
    title: 'Le framework "F-O-R-D" pour répondre aux objections sans être pushy',
    excerpt: 'Feel · Offer · Reframe · Decide — la séquence calme qui désamorce les "je vais réfléchir".',
    readMinutes: 4,
    body: [
      'Feel : valide l\'émotion. "Je comprends que ça représente un investissement important."',
      'Offer : repose la valeur unique. "Ce qu\'on apporte de différent, c\'est..."',
      'Reframe : recadre la décision. "La vraie question n\'est pas le prix, c\'est combien te coûte de ne rien changer pendant 6 mois."',
      'Decide : aide à trancher avec une question fermée. "Tu préfères qu\'on démarre lundi ou la semaine d\'après ?"',
    ],
  },
];

export const CATEGORY_LABELS = {
  social: 'Social Media',
  ads: 'Publicité',
  site: 'Site & e-commerce',
  influence: 'Influence',
  sales: 'Closing',
};

export const CATEGORY_COLORS = {
  social: 'from-fuchsia-500/20 to-pink-500/10',
  ads: 'from-amber-500/20 to-orange-500/10',
  site: 'from-blue-500/20 to-cyan-500/10',
  influence: 'from-violet-500/20 to-purple-500/10',
  sales: 'from-emerald-500/20 to-green-500/10',
};
