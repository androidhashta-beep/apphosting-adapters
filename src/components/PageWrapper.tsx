'use client';

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut, Shield } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useAuth, useUser } from "@/firebase";
import { useUserProfile } from "@/hooks/useUserProfile";
import { signOut } from "firebase/auth";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function PageWrapper({ children, title, showBackButton = true }: { children: React.ReactNode, title: string, showBackButton?: boolean }) {
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const { profile } = useUserProfile();

  const handleGoHome = async () => {
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      await signOut(auth);
    }
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
        <div className="container relative mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button onClick={handleGoHome} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Home
              </button>
            )}
          </div>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold md:text-xl whitespace-nowrap">{title}</h1>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            {profile?.role === 'admin' && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon">
                                <Link href="/admin">
                                    <Shield className="h-4 w-4" />
                                    <span className="sr-only">Admin Panel</span>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Admin Panel</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            {user && !user.isAnonymous && (
               <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                       <Button variant="ghost" size="icon" onClick={handleSignOut}>
                          <LogOut className="h-4 w-4" />
                          <span className="sr-only">Sign Out</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sign Out</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
