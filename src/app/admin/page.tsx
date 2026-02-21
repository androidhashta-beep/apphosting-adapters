'use client';

import { AdminClient } from './AdminClient';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  // useUserProfile now handles the password change redirect internally
  const { profile, isLoading: isProfileLoading } = useUserProfile();

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return;
    }

    if (!user || user.isAnonymous) {
      router.replace('/login?redirect=/admin');
      return;
    }

    // The password change redirect is now handled by the useUserProfile hook,
    // but we still need to gate access based on role.
    if (profile?.role !== 'admin') {
      localStorage.removeItem('app-instance-role');
      sessionStorage.setItem('force-role-selection', 'true');
      router.replace('/');
      // You could add a toast here to inform the user they don't have access.
      return;
    }

  }, [user, isUserLoading, profile, isProfileLoading, router]);

  const isLoading = isUserLoading || isProfileLoading;

  // We show a loader if auth is loading, if the profile is loading,
  // or if the profile is loaded but requires a password change (to prevent a flash of content before redirect).
  if (isLoading || !profile || profile.role !== 'admin' || profile.mustChangePassword) {
    return (
      <div className="flex h-[calc(100vh-10rem)] w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  return <>{children}</>;
}


export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminClient />
    </AdminAuthGuard>
  );
}
