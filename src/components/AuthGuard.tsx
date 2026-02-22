
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      // If loading is finished...
      if (!user) {
        // If there is no user, redirect to login.
        router.replace('/login');
      } else if (user.isAnonymous) {
        // Anonymous users are not allowed in protected routes.
        router.replace('/login');
      }
    }
  }, [isUserLoading, user, router]);
  
  // While checking, or if a redirect is imminent, show a loader.
  if (isUserLoading || !user || user.isAnonymous) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If we're here, the user is authenticated and not anonymous.
  return <>{children}</>;
}
