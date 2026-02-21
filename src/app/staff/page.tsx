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
  const { user, isUserLoading } = useUser();
  // useUserProfile now handles the password change redirect internally
  const { profile, isLoading: isProfileLoading } = useUserProfile();

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return;
    }

    if (!user || user.isAnonymous) {
      router.replace('/login?redirect=/staff');
      return;
    }
    
    // The password change redirect is handled by the hook.
    // We just need to check for the correct role.
    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      localStorage.removeItem('app-instance-role');
      sessionStorage.setItem('force-role-selection', 'true');
      router.replace('/');
      return;
    }
  }, [user, isUserLoading, profile, isProfileLoading, router]);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !profile || profile.mustChangePassword) {
    return (
      <div className="flex h-[calc(100vh-10rem)] w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access...</p>
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
