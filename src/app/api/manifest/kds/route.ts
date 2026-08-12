import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return new NextResponse('Slug is required', { status: 400 });
  }

  const manifest = {
    id: `/${slug}/cocina`,
    scope: `/${slug}/cocina`,
    name: "Glubbi KDS - Monitor de Cocina",
    short_name: "Glubbi KDS",
    description: "Glubbi Kitchen Display System - Monitor de Cocina en Tiempo Real",
    start_url: `/${slug}/cocina`,
    display: "standalone",
    background_color: "#1e222a",
    theme_color: "#f97316",
    orientation: "landscape",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/logo-glubbi.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/favicon.ico",
        sizes: "64x64 32x32 24x24 16x16",
        type: "image/x-icon"
      }
    ]
  };

  return NextResponse.json(manifest);
}
