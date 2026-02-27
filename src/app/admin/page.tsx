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
    if (!isLoading && profile && profile.role !== 'admin') {
      // If loading is done and user is not an admin, redirect.
      router.replace('/staff');
    }
  }, [isLoading, profile, router]);
  
  // Show a loader while checking the role.
  // AuthGuard has already checked for a logged-in user.
  if (isLoading || profile && profile.role !== 'admin') {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }
  
  // If we're here, user is an admin.
  return <>{children}</>;
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
