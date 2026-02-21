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
  const { profile, isLoading: isProfileLoading } = useUserProfile();

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return;
    }

    if (!user) {
      router.replace('/login?redirect=/admin');
      return;
    }

    if (user.isAnonymous) {
      router.replace('/login?redirect=/admin');
      return;
    }

    if (profile?.mustChangePassword) {
      router.replace('/change-password?redirect=/admin');
      return;
    }

    if (profile?.role !== 'admin') {
      // If the user is not an admin, send them back to the role selector
      // and show a message.
      localStorage.removeItem('app-instance-role');
      sessionStorage.setItem('force-role-selection', 'true');
      router.replace('/');
      // Consider showing a toast message here in a real app.
      return;
    }

  }, [user, isUserLoading, profile, isProfileLoading, router]);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !user || !profile || profile.role !== 'admin' || profile.mustChangePassword) {
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
