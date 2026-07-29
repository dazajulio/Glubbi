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
    name: `KDS - ${slug}`,
    short_name: "KDS",
    description: "Kitchen Display System",
    start_url: `/${slug}/cocina`,
    display: "standalone",
    background_color: "#1e293b",
    theme_color: "#f97316",
    orientation: "landscape",
    icons: [
      {
        src: "/logo-glubbi.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/logo-glubbi.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };

  return NextResponse.json(manifest);
}
