import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Omniscale — On scale ton business';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0a0a12 0%, #1a0a2e 50%, #0a0a12 100%)',
          color: 'white',
          padding: 80,
          position: 'relative',
        }}
      >
        {/* Glow blobs */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'rgba(183, 148, 232, 0.25)',
            filter: 'blur(120px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -200,
            left: -200,
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: 'rgba(124, 58, 237, 0.18)',
            filter: 'blur(140px)',
          }}
        />

        {/* Logo lozenge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 60 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#B794E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 800,
              color: '#000',
            }}
          >
            O
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>omniscale</div>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.6)', marginBottom: 24, letterSpacing: -0.5 }}>
            Agence marketing
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -3, lineHeight: 1, marginBottom: 24, display: 'flex', flexWrap: 'wrap' }}>
            On scale ton{' '}
            <span style={{ background: 'linear-gradient(135deg, #B794E8, #7C3AED)', backgroundClip: 'text', color: 'transparent', marginLeft: 18 }}>
              business.
            </span>
          </div>
          <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.7)', marginTop: 16, maxWidth: 1000 }}>
            Boutiques, restaurants, e-commerce — social media, ads, sites, influence.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 40, fontSize: 24, color: 'rgba(255,255,255,0.5)' }}>
          <div>omniscale.fr</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <span>Insta</span>
            <span>TikTok</span>
            <span>YouTube</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
