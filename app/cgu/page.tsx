import LegalPage from '@/components/LegalPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation — Omniscale',
  description: 'Conditions Générales d\'Utilisation du site et des services Omniscale.',
  robots: { index: true, follow: true },
};

export default function CGUPage() {
  return (
    <LegalPage
      title="Conditions Générales d'Utilisation"
      subtitle="Dernière mise à jour : 22 avril 2026."
    >
      <Section title="1. Objet">
        <p>
          Les présentes Conditions Générales d'Utilisation (ci-après « CGU »)
          régissent l'utilisation du site internet <strong>omniscale.fr</strong>{' '}
          (ci-après le « Site ») et des services proposés par Omniscale, notamment
          l'espace client en ligne et les outils de pilotage marketing
          (ci-après les « Services »).
        </p>
        <p>
          L'accès au Site et aux Services implique l'acceptation pleine et entière
          des présentes CGU.
        </p>
      </Section>

      <Section title="2. Accès aux Services">
        <p>
          L'accès à l'espace client est conditionné à la création d'un compte
          gratuit ou à l'attribution d'un accès par notre équipe dans le cadre
          d'une prestation. Vous vous engagez à fournir des informations exactes
          lors de votre inscription et à les maintenir à jour.
        </p>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants. Toute
          activité réalisée depuis votre compte est présumée effectuée par vous.
          En cas d'utilisation frauduleuse, contactez-nous immédiatement à{' '}
          <a href="mailto:contact@omniscale.fr" className="text-lilac hover:underline">contact@omniscale.fr</a>.
        </p>
      </Section>

      <Section title="3. Description des Services">
        <p>
          Omniscale propose à ses clients des prestations de marketing digital
          (social media, publicité en ligne, création de sites internet, marketing
          d'influence) accompagnées d'un espace client en ligne donnant accès à :
        </p>
        <ul>
          <li>Un dashboard de performances (statistiques sociales, ROAS, vidéos publiées) ;</li>
          <li>Un système de tâches, rendez-vous et factures partagés ;</li>
          <li>La connexion OAuth de comptes sociaux tiers (Instagram, TikTok, YouTube) ;</li>
          <li>Des outils de communication avec l'équipe Omniscale.</li>
        </ul>
      </Section>

      <Section title="4. Connexion de comptes tiers">
        <p>
          Lorsque vous connectez un compte social (Instagram, TikTok, YouTube),
          vous autorisez Omniscale à accéder uniquement aux données strictement
          nécessaires à la prestation : statistiques publiques, liste de vos
          publications récentes, métriques d'engagement. Aucune action de
          publication ou de modification n'est effectuée sans votre accord
          explicite.
        </p>
        <p>
          Vous pouvez révoquer cet accès à tout moment depuis la page{' '}
          <em>Connexions</em> de votre espace client, ou directement depuis les
          paramètres de la plateforme tierce concernée.
        </p>
      </Section>

      <Section title="5. Tarifs et facturation">
        <p>
          L'accès au Site et à l'espace client est gratuit. Les prestations
          d'accompagnement marketing font l'objet d'un devis personnalisé et
          d'un contrat distinct conclu entre vous et Omniscale.
        </p>
      </Section>

      <Section title="6. Propriété intellectuelle">
        <p>
          L'ensemble des éléments composant le Site et les Services (interface,
          textes, charte graphique, code source) demeure la propriété exclusive
          d'Omniscale. Les contenus que vous déposez sur la plateforme (textes,
          médias, données) restent votre propriété. Vous concédez à Omniscale
          une licence non-exclusive d'utilisation de ces contenus, strictement
          limitée à l'exécution des Services.
        </p>
      </Section>

      <Section title="7. Disponibilité">
        <p>
          Omniscale s'engage à mettre en œuvre les meilleurs moyens pour assurer
          la disponibilité du Site et des Services. Toutefois, des interruptions
          peuvent survenir pour des opérations de maintenance ou en cas de force
          majeure. Omniscale ne saurait être tenue responsable des préjudices
          résultant de ces interruptions.
        </p>
      </Section>

      <Section title="8. Suppression de compte">
        <p>
          Vous pouvez demander la suppression de votre compte et de l'ensemble
          des données associées à tout moment en envoyant un email à{' '}
          <a href="mailto:contact@omniscale.fr" className="text-lilac hover:underline">contact@omniscale.fr</a>.
          La suppression est effective sous 30 jours, sous réserve des obligations
          légales de conservation (notamment factures).
        </p>
      </Section>

      <Section title="9. Modification des CGU">
        <p>
          Omniscale se réserve le droit de modifier les présentes CGU à tout
          moment. Les utilisateurs seront informés des modifications substantielles
          par email ou via une notification sur le Site.
        </p>
      </Section>

      <Section title="10. Droit applicable">
        <p>
          Les présentes CGU sont régies par le droit français. Tout litige
          relatif à leur interprétation ou exécution sera de la compétence
          exclusive des tribunaux français, sous réserve des dispositions
          impératives applicables aux consommateurs.
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
