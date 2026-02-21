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
  const { profile, isLoading: isProfileLoading } = useUserProfile();

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return;
    }

    if (!user || user.isAnonymous) {
      router.replace('/login?redirect=/staff');
      return;
    }

    if (profile?.mustChangePassword) {
      router.replace('/change-password?redirect=/staff');
      return;
    }

    // Admins can also access the staff dashboard
    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      localStorage.removeItem('app-instance-role');
      sessionStorage.setItem('force-role-selection', 'true');
      router.replace('/');
      return;
    }
  }, [user, isUserLoading, profile, isProfileLoading, router]);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !user || !profile || profile.mustChangePassword) {
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
