import ClientDetailView from './ClientDetailView';

export default function AdminClientDetailPage({ params }: { params: { slug: string } }) {
  return <ClientDetailView slug={params.slug} />;
}
