import LegalPage from '@/components/LegalPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales — Omniscale',
  description: 'Mentions légales du site omniscale.fr.',
  robots: { index: true, follow: true },
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      title="Mentions légales"
      subtitle="Informations légales relatives à l'éditeur du site omniscale.fr."
    >
      <Section title="1. Éditeur du site">
        <p>
          Le site <strong>omniscale.fr</strong> est édité par <strong>Omniscale</strong>,
          micro-entreprise.
        </p>
        <ul>
          <li>Email : <a href="mailto:contact@omniscale.fr" className="text-lilac hover:underline">contact@omniscale.fr</a></li>
          <li>Téléphone : disponible sur demande</li>
          <li>SIRET : à compléter</li>
          <li>Numéro de TVA intracommunautaire : non applicable (régime franchise en base)</li>
        </ul>
        <p className="text-sm text-white/50">
          Pour toute demande relative aux mentions légales (notamment SIRET et adresse),
          merci de nous contacter directement par email.
        </p>
      </Section>

      <Section title="2. Directeur de la publication">
        <p>Le directeur de la publication est le représentant légal d'Omniscale.</p>
      </Section>

      <Section title="3. Hébergeur">
        <p>
          Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133,
          Walnut, CA 91789, United States — <a href="https://vercel.com" className="text-lilac hover:underline" target="_blank" rel="noopener noreferrer">vercel.com</a>.
        </p>
        <p>
          La base de données et l'authentification sont fournies par{' '}
          <strong>Supabase Inc.</strong>, 970 Toa Payoh North #07-04, Singapore 318992 —{' '}
          <a href="https://supabase.com" className="text-lilac hover:underline" target="_blank" rel="noopener noreferrer">supabase.com</a>.
        </p>
      </Section>

      <Section title="4. Propriété intellectuelle">
        <p>
          L'ensemble des contenus présents sur omniscale.fr (textes, images, logos,
          vidéos, charte graphique, code source) est la propriété exclusive d'Omniscale
          ou de ses partenaires, sauf mention contraire. Toute reproduction, représentation,
          modification, publication, transmission ou exploitation totale ou partielle des
          contenus du site, par quelque procédé que ce soit, sans autorisation écrite
          préalable, est strictement interdite.
        </p>
      </Section>

      <Section title="5. Liens hypertextes">
        <p>
          Le site peut contenir des liens vers d'autres sites internet. Omniscale n'est
          pas responsable du contenu, de la disponibilité ni des pratiques en matière
          de protection des données personnelles de ces sites tiers.
        </p>
      </Section>

      <Section title="6. Crédits">
        <p>
          Design, développement et marketing : <strong>Omniscale</strong>.<br />
          Photographies : Omniscale, ses clients et Unsplash (licence libre).<br />
          Polices : Inter, Space Grotesk (Google Fonts).
        </p>
      </Section>
    </LegalPage>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold tracking-tight mt-10 mb-3 text-white">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
