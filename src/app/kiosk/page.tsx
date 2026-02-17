import { KioskClient } from './KioskClient';
import { PageWrapper } from '@/components/PageWrapper';

export default function KioskPage() {
  return (
    <PageWrapper title="Ticket Kiosk">
      <KioskClient />
    </PageWrapper>
  );
}
