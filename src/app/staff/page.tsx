
'use client';

import { StaffClient } from './StaffClient';
import { PageWrapper } from '@/components/PageWrapper';
import { AuthGuard } from '@/components/AuthGuard';

export default function StaffPage() {
  return (
    <PageWrapper title="Staff Dashboard" showBackButton={true}>
      <AuthGuard>
        <StaffClient />
      </AuthGuard>
    </PageWrapper>
  );
}
