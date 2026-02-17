import { AdminClient } from './AdminClient';
import { PageWrapper } from '@/components/PageWrapper';

export default function AdminPage() {
  return (
    <PageWrapper title="Admin Panel">
      <AdminClient />
    </PageWrapper>
  );
}
