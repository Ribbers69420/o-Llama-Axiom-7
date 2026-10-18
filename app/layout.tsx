import type {Metadata} from 'next';
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

export const metadata: Metadata = {
  title: 'AXIOM-7: Guardian of Truth | PIXELVERSE-9',
  description: 'Interactive 3D spatial action-adventure game set in PIXELVERSE-9 where AXIOM-7 purges misinformation across 6 canonical chapters using swappable Tank, Wizard, and Cosmic forms and a High-Thinking Truth Analyzer.',
  openGraph: {
    title: 'AXIOM-7: Guardian of Truth | PIXELVERSE-9',
    description: 'Interactive 3D spatial action-adventure game set in PIXELVERSE-9 where AXIOM-7 purges misinformation across 6 canonical chapters using swappable Tank, Wizard, and Cosmic forms and a High-Thinking Truth Analyzer.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AXIOM-7: Guardian of Truth | PIXELVERSE-9',
    description: 'Interactive 3D spatial action-adventure game set in PIXELVERSE-9 where AXIOM-7 purges misinformation across 6 canonical chapters using swappable Tank, Wizard, and Cosmic forms and a High-Thinking Truth Analyzer.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${chakraPetch.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="bg-[#050510] text-white antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
