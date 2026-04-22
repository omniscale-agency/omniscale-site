import LegalPage from '@/components/LegalPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Omniscale',
  description: 'Comment Omniscale collecte, utilise et protège vos données personnelles. Conforme RGPD.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      subtitle="Comment nous protégeons vos données. Conforme RGPD. Dernière mise à jour : 22 avril 2026."
    >
      <Section title="1. Responsable du traitement">
        <p>
          Le responsable du traitement des données personnelles collectées sur
          omniscale.fr est <strong>Omniscale</strong>, joignable par email à{' '}
          <a href="mailto:contact@omniscale.fr" className="text-lilac hover:underline">contact@omniscale.fr</a>.
        </p>
      </Section>

      <Section title="2. Données collectées">
        <p>Nous collectons et traitons les catégories de données suivantes :</p>
        <ul>
          <li>
            <strong>Données d'identification</strong> : nom, prénom, email, téléphone,
            mot de passe (haché), nom de votre marque/commerce, secteur d'activité, ville.
          </li>
          <li>
            <strong>Données de connexion sociale</strong> (uniquement si vous connectez
            vos comptes) : identifiants des plateformes (Instagram, TikTok, YouTube),
            tokens d'accès chiffrés, nom d'utilisateur public, statistiques d'audience,
            liste de vos publications récentes.
          </li>
          <li>
            <strong>Données de navigation</strong> : adresse IP, type de navigateur,
            pages visitées, source du trafic (referrer, paramètres UTM), via PostHog
            (anonymisé jusqu'à connexion).
          </li>
          <li>
            <strong>Données contractuelles</strong> : factures, rendez-vous, échanges
            avec notre équipe.
          </li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        <p>Vos données sont traitées pour les finalités suivantes :</p>
        <ul>
          <li>Vous fournir l'accès à votre espace client et aux Services ;</li>
          <li>Vous permettre de connecter et visualiser vos comptes sociaux ;</li>
          <li>Vous envoyer des communications opérationnelles (factures, RDV, tâches) ;</li>
          <li>Mesurer la performance du site (analyse de trafic, optimisation UX) ;</li>
          <li>Respecter nos obligations légales (comptabilité, archivage).</li>
        </ul>
      </Section>

      <Section title="4. Bases légales">
        <p>Les traitements reposent sur :</p>
        <ul>
          <li>L'<strong>exécution du contrat</strong> qui nous lie pour la fourniture des Services ;</li>
          <li>Votre <strong>consentement explicite</strong> pour la connexion de vos comptes sociaux ;</li>
          <li>Notre <strong>intérêt légitime</strong> à mesurer l'audience du site et améliorer l'expérience ;</li>
          <li>Le respect d'<strong>obligations légales</strong> (facturation, conservation comptable).</li>
        </ul>
      </Section>

      <Section title="5. Durée de conservation">
        <ul>
          <li>Compte client : pendant toute la durée de la relation commerciale, puis 3 ans après la dernière activité ;</li>
          <li>Factures et données comptables : 10 ans (obligation légale) ;</li>
          <li>Données de navigation analytiques : 13 mois maximum ;</li>
          <li>Tokens OAuth de comptes sociaux : jusqu'à révocation par l'utilisateur ou expiration du token.</li>
        </ul>
      </Section>

      <Section title="6. Destinataires des données">
        <p>
          Vos données ne sont jamais vendues. Elles peuvent être traitées par
          nos sous-traitants techniques, qui agissent sur instruction et avec
          des garanties contractuelles :
        </p>
        <ul>
          <li><strong>Vercel</strong> (USA) — hébergement du Site ;</li>
          <li><strong>Supabase</strong> (UE — Irlande) — base de données et authentification ;</li>
          <li><strong>Resend</strong> (USA) — envoi d'emails transactionnels ;</li>
          <li><strong>PostHog</strong> (USA) — analyse d'audience anonymisée ;</li>
          <li><strong>Google, Meta, TikTok</strong> — uniquement pour les flows OAuth de connexion sociale, sur votre demande explicite.</li>
        </ul>
        <p className="text-sm text-white/60">
          Les transferts vers des pays hors UE (USA notamment) sont encadrés par
          les Clauses Contractuelles Types de la Commission européenne (SCC) et
          le Data Privacy Framework UE-USA.
        </p>
      </Section>

      <Section title="7. Vos droits">
        <p>
          Conformément au RGPD, vous disposez des droits suivants sur vos données
          personnelles :
        </p>
        <ul>
          <li><strong>Accès</strong> — obtenir une copie de vos données ;</li>
          <li><strong>Rectification</strong> — corriger des données inexactes ;</li>
          <li><strong>Effacement</strong> (« droit à l'oubli ») — demander la suppression de vos données ;</li>
          <li><strong>Limitation</strong> — restreindre certains traitements ;</li>
          <li><strong>Portabilité</strong> — récupérer vos données dans un format structuré ;</li>
          <li><strong>Opposition</strong> — vous opposer à un traitement (notamment marketing) ;</li>
          <li><strong>Retrait du consentement</strong> à tout moment pour les traitements basés sur celui-ci.</li>
        </ul>
        <p>
          Pour exercer ces droits, écrivez-nous à{' '}
          <a href="mailto:contact@omniscale.fr" className="text-lilac hover:underline">contact@omniscale.fr</a>.
          Nous répondons sous 30 jours maximum.
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez
          introduire une réclamation auprès de la <strong>CNIL</strong> ({' '}
          <a href="https://www.cnil.fr" className="text-lilac hover:underline" target="_blank" rel="noopener noreferrer">cnil.fr</a>).
        </p>
      </Section>

      <Section title="8. Cookies et traceurs">
        <p>
          Le Site utilise les cookies et technologies similaires suivants :
        </p>
        <ul>
          <li>
            <strong>Cookies strictement nécessaires</strong> (session, authentification
            Supabase) — exemptés de consentement ;
          </li>
          <li>
            <strong>Cookies de mesure d'audience anonymisée</strong> (PostHog) —
            initialisés en mode <em>identified_only</em> : aucun profil utilisateur
            persistant n'est créé tant que vous n'êtes pas connecté à votre espace.
          </li>
        </ul>
        <p>
          Vous pouvez à tout moment configurer votre navigateur pour bloquer
          ces cookies. Cela peut affecter votre expérience.
        </p>
      </Section>

      <Section title="9. Sécurité">
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles
          adaptées pour protéger vos données : chiffrement HTTPS, hachage des
          mots de passe, isolation par utilisateur via Row-Level Security
          Postgres, accès restreint à la base de données, audits réguliers.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          Pour toute question relative à cette politique ou à l'exercice de
          vos droits, contactez-nous à{' '}
          <a href="mailto:contact@omniscale.fr" className="text-lilac hover:underline">contact@omniscale.fr</a>.
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
