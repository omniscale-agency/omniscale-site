import { CLIENTS } from '@/lib/mockData';
import ClientDetailView from './ClientDetailView';

export function generateStaticParams() {
  return CLIENTS.map((c) => ({ slug: c.slug }));
}

export default function AdminClientDetailPage({ params }: { params: { slug: string } }) {
  return <ClientDetailView slug={params.slug} />;
}
