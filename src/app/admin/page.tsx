
'use client';

import { AdminClient } from './AdminClient';
import { AuthGuard } from '@/components/AuthGuard';
import { PageWrapper } from '@/components/PageWrapper';

export default function AdminPage() {
  return (
    <PageWrapper title="Admin Panel" showBackButton={true}>
      <AuthGuard adminOnly={true}>
        <AdminClient />
      </AuthGuard>
    </PageWrapper>
  );
}
