import { StaffClient } from './StaffClient';
import { PageWrapper } from '@/components/PageWrapper';

export default function StaffPage() {
  return (
    <PageWrapper title="Staff Dashboard" showBackButton={false}>
      <StaffClient />
    </PageWrapper>
  );
}
