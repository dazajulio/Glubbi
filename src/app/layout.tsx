import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const siteTitle = 'Glubbi | Plataforma de Pedidos Online';
const siteDescription =
  'Automatiza los pedidos de tu restaurante, dark kitchen o comercio. Menú digital interactivo, autopedido por QR en mesa, delivery directo por WhatsApp y monitor de cocina (KDS) sin comisiones.';
const siteUrl = 'https://glubbi.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  keywords: [
    'software para restaurantes',
    'plataforma de pedidos online',
    'menu digital qr',
    'automatizar pedidos whatsapp',
    'pantalla de cocina kds',
    'delivery sin comisiones',
    'dark kitchen software',
    'autopedido en mesa',
    'glubbi',
  ],
  manifest: '/manifest.json',
  verification: {
    google: 'google33d68a5f53fec96a',
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: 'Glubbi',
    images: [
      {
        url: '/glubbi-header-banner.jpg?v=2',
        width: 1200,
        height: 630,
        alt: 'Glubbi — Plataforma de Pedidos Online para Restaurantes',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/glubbi-header-banner.jpg?v=2'],
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Glubbi',
    operatingSystem: 'Web, Android, iOS',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '29.00',
      priceCurrency: 'USD',
    },
    description:
      'Plataforma de automatización de pedidos, menú digital interactivo, autopedido por QR en mesa, delivery directo por WhatsApp y pantalla de cocina (KDS) para restaurantes y dark kitchens.',
    url: siteUrl,
  };

  return (
    <html lang="es" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google Analytics 4 (GA4) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-ZXV2RDNGSV"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ZXV2RDNGSV', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
