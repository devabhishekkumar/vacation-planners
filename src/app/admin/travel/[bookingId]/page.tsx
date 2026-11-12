import { travelOperator } from '@/lib/travel/operator';
import { travelBooking } from '@/lib/travel/service';
import { notFound } from 'next/navigation';
import OperatorAccess from '@/components/travel/OperatorAccess';
import TravelManager from '@/components/travel/TravelManager';
import '@/components/travel/travel.css';
export const dynamic = 'force-dynamic';
export default async function ManageTravel({ params }: { params: Promise<{ bookingId: string }> }) {
  if (!(await travelOperator()))
    return (
      <div className="tm-page">
        <OperatorAccess
          configured={Boolean(
            process.env.TRAVEL_ADMIN_KEY && process.env.TRAVEL_ADMIN_KEY.length >= 24,
          )}
        />
      </div>
    );
  const { bookingId } = await params;
  try {
    travelBooking(bookingId, { admin: true });
  } catch {
    notFound();
  }
  return <TravelManager key={bookingId} bookingId={bookingId} admin />;
}
