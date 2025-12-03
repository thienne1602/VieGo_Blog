import TourDetailPageClient from "./TourDetailPageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TourDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <TourDetailPageClient initialId={id} />;
}
