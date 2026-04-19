/** @type {import('next').NextConfig} */
const nextConfig = {
  // Phase 2 : SSR via Vercel (plus de static export pour permettre auth + DB côté serveur)
  images: { unoptimized: true },
  trailingSlash: true,
};
module.exports = nextConfig;
