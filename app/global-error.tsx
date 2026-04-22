'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#000', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: '#f87171', marginBottom: 12 }}>
            Erreur critique
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, lineHeight: 1.1 }}>
            Une erreur inattendue s'est produite
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
            Notre équipe a été notifiée. Tu peux retenter ou nous contacter.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>
              Code : {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ background: '#B794E8', color: '#000', fontWeight: 600, padding: '12px 24px', borderRadius: 9999, border: 'none', cursor: 'pointer', marginRight: 8 }}
          >
            Réessayer
          </button>
          <a
            href="/"
            style={{ color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 9999, border: '1px solid rgba(255,255,255,0.2)', display: 'inline-block' }}
          >
            Retour à l'accueil
          </a>
        </div>
      </body>
    </html>
  );
}
