'use client';

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function PageWrapper({ children, title, showBackButton = true }: { children: React.ReactNode, title: string, showBackButton?: boolean }) {
  const router = useRouter();

  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    router.push('/');
  };

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
