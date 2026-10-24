import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'AXIOM-7: Guardian of Truth | PIXELVERSE-9',
    short_name: 'AXIOM-7',
    description:
      'Offline-compatible 3D spatial action-adventure game powered by a Rust/WASM physics & truth kernel, relational SQL engine, and D3.js telemetry visualizations.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#050510',
    theme_color: '#050510',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
