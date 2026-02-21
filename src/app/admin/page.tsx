'use client';

import { AdminClient } from './AdminClient';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, isLoading } = useUserProfile();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!profile) {
      router.replace('/');
      return;
    }

    if (profile.role !== 'admin') {
      localStorage.removeItem('app-instance-role');
      sessionStorage.setItem('force-role-selection', 'true');
      router.replace('/');
      return;
    }
  }, [profile, isLoading, router]);

  if (isLoading || !profile || profile.role !== 'admin') {
    return (
      <PageWrapper title="Admin Panel" showBackButton={true}>
        <div className="flex h-[calc(100vh-10rem)] w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Verifying access...</p>
        </div>
      </PageWrapper>
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
