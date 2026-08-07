import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Glubbi Partners — Ecosistema para Negocios sin Comisiones',
  description:
    'Únete a Glubbi. Gestiona tu negocio con nuestro ecosistema integral (KDS, Kiosko, Analíticas) por una tarifa plana y vende sin comisiones.',
  manifest: '/manifest.json',
  verification: {
    google: 'google33d68a5f53fec96a',
  },
  icons: {
    icon: [
      {
        url: '/icon.png?v=2',
        type: 'image/png',
      },
    ],
    shortcut: '/icon.png?v=2',
    apple: '/icon.png?v=2',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
