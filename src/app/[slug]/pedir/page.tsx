import { redirect } from 'next/navigation';

interface PedirPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PedirPage({ params }: PedirPageProps) {
  const { slug } = await params;

  // Direct redirect to delivery kiosk ordering flow
  redirect(`/${slug}/mesa/takeaway?type=delivery`);
}
