'use client';

import { PageWrapper } from '@/components/PageWrapper';
import { AuthGuard } from '@/components/AuthGuard';
import { StationSelectorClient } from './StationSelectorClient';

export default function StationSelectorPage() {
  return (
    <PageWrapper title="Select Station" showBackButton={true}>
      <AuthGuard>
        <StationSelectorClient />
      </AuthGuard>
    </PageWrapper>
  );
}
