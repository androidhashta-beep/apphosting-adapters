
'use client';

import { AdminClient } from './AdminClient';
import { PageWrapper } from '@/components/PageWrapper';
import { AuthGuard } from '@/components/AuthGuard';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function AdminRoleGuard({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useUserProfile();
  const router = useRouter();

  // Redirect non-admins away
  useEffect(() => {
    if (!isLoading && profile?.role !== 'admin') {
      router.replace('/staff');
    }
  }, [isLoading, profile, router]);
  
  // While loading, show a loader.
  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }
  
  // If loading is done and the user is an admin, show the content.
  if (profile?.role === 'admin') {
    return <>{children}</>;
  }

  // For non-admins (or on error), show the loader while redirecting.
  return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
  );
}


export default function AdminPage() {
  return (
    <PageWrapper title="Admin Panel" showBackButton={true}>
      <AuthGuard>
        <AdminRoleGuard>
          <AdminClient />
        </AdminRoleGuard>
      </AuthGuard>
    </PageWrapper>
  );
}
