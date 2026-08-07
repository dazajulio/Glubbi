import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Glubbi | Plataforma de Pedidos Online',
  description:
    'Automatiza los pedidos de tu restaurante, dark kitchen o comercio. Menú digital interactivo, autopedido por QR en mesa, delivery directo y monitor de cocina (KDS) sin comisiones.',
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
