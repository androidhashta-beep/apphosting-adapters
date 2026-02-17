import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export function PageWrapper({ children, title, showBackButton = true }: { children: React.ReactNode, title: string, showBackButton?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-4 w-1/3">
            {showBackButton && (
              <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <Image src="/logo.png" alt="Renaissance Training Center Inc. Logo" width={40} height={40} className="object-cover" />
            <h1 className="text-lg font-bold md:text-xl whitespace-nowrap">{title}</h1>
          </div>
          <div className="w-1/3"></div>
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
