import TourJourneyPageClient from "./TourJourneyPageClient";

type RouteParams = {
  bookingId?: string;
};

type PageProps = {
  params: RouteParams | Promise<RouteParams>;
};

async function resolveParams(
  params: RouteParams | Promise<RouteParams>
): Promise<RouteParams> {
  return Promise.resolve(params);
}

export default async function TourJourneyPage({ params }: PageProps) {
  const resolvedParams = await resolveParams(params);
  const bookingId = resolvedParams?.bookingId ?? "";

  return <TourJourneyPageClient initialBookingId={bookingId} />;
}
