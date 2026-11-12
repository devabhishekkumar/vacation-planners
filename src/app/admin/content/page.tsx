import { travelOperator } from '@/lib/travel/operator';
import OperatorAccess from '@/components/travel/OperatorAccess';
import ContentEditor from '@/components/content/ContentEditor';
import '@/components/travel/travel.css';
import './content.css';
export const dynamic = 'force-dynamic';
export default async function WebsiteContent() {
  if (!(await travelOperator()))
    return (
      <div className="tm-page">
        <OperatorAccess
          configured={Boolean(
            process.env.TRAVEL_ADMIN_KEY && process.env.TRAVEL_ADMIN_KEY.length >= 24,
          )}
          title="Website content"
        />
      </div>
    );
  return <ContentEditor />;
}
