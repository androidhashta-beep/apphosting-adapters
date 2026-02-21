
'use client';

import { StaffClient } from './StaffClient';
import { PageWrapper } from '@/components/PageWrapper';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function StaffAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isUserLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile();

  // No complex auth logic here anymore, since we use anonymous users.
  // The useUserProfile hook will ensure a profile is created.
  // We just show a loader while things are initializing.
  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return <>{children}</>;
}


export default function StaffPage() {
  return (
    <PageWrapper title="Staff Dashboard" showBackButton={true}>
      <StaffAuthGuard>
        <StaffClient />
      </StaffAuthGuard>
    </PageWrapper>
  );
}
