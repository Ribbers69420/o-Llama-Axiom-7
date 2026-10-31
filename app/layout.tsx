import type { Metadata, Viewport } from 'next';
import { Chakra_Petch, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
});

export const viewport: Viewport = {
  themeColor: '#050510',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'AXIOM-7: Guardian of Truth | PIXELVERSE-9',
  description:
    'Offline-compatible 3D spatial action-adventure game set in PIXELVERSE-9 with Rust/WASM physics & truth kernel, SQL relational engine, and D3.js telemetry studio.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AXIOM-7',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'AXIOM-7: Guardian of Truth | PIXELVERSE-9',
    description:
      'Offline-compatible 3D spatial action-adventure game set in PIXELVERSE-9 with Rust/WASM physics & truth kernel, SQL relational engine, and D3.js telemetry studio.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AXIOM-7: Guardian of Truth | PIXELVERSE-9',
    description:
      'Offline-compatible 3D spatial action-adventure game set in PIXELVERSE-9 with Rust/WASM physics & truth kernel, SQL relational engine, and D3.js telemetry studio.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${chakraPetch.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#050510] text-white antialiased overflow-hidden select-none"
      >
        {children}
      </body>
    </html>
  );
}
