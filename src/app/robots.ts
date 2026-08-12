import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/*/*/cocina',
        '/*/*/gerente',
        '/*/mesa/*',
        '/kyc-mobile/',
      ],
    },
    sitemap: 'https://glubbi.app/sitemap.xml',
  };
}
