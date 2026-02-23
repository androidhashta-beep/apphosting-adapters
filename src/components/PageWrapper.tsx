
'use client';

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut, Shield } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useAuth } from "@/firebase";
import { useUserProfile } from "@/hooks/useUserProfile";
import { signOut } from "firebase/auth";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";

export function PageWrapper({ children, title, showBackButton = true }: { children: React.ReactNode, title: string, showBackButton?: boolean }) {
  const router = useRouter();
  const auth = useAuth();
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const { toast } = useToast();

  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    window.location.assign('/');
  };

  const handleSignOut = async () => {
    try {
        await signOut(auth);
        toast({
            title: "Signed Out",
            description: "You have been successfully signed out."
        });
        handleGoHome();
    } catch (error) {
        console.error("Sign out failed:", error);
        toast({
            variant: "destructive",
            title: "Sign Out Failed",
            description: "Could not sign out. Please try again.",
        });
    }
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
            {isProfileLoading ? (
                <Skeleton className="h-8 w-28 hidden sm:block" />
            ) : profile ? (
                <div className="text-sm text-right hidden sm:block">
                    <p className="font-semibold text-foreground truncate">{profile.displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
                </div>
            ) : null}
            <ThemeSwitcher />
            {profile?.role === 'admin' && (
              <Link href="/admin" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <Shield className="h-4 w-4" />
                  Admin
              </Link>
            )}
            <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" />
                      <span className="sr-only">Sign Out / Change Role</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign Out & Change Role</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
