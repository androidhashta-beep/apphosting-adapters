'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Settings } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useDoc,
  useFirebase,
  setDocumentNonBlocking,
  useMemoFirebase,
} from '@/firebase';
import { doc } from 'firebase/firestore';
import { CarouselSettings } from './CarouselSettings';
import { StationManagement } from './StationManagement';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminClient() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'app') : null),
    [firestore]
  );
  const { data: settings, isLoading: isLoadingSettings } =
    useDoc<Settings>(settingsRef);
    
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || '');
      setCompanyLogoUrl(settings.companyLogoUrl || '');
    }
  }, [settings]);

  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };

  const handleCompanySettingsSave = () => {
    if (settingsRef) {
      setDocumentNonBlocking(settingsRef, { companyName, companyLogoUrl }, { merge: true });
      toast({
        title: 'Settings Saved',
        description: 'Company settings have been updated.',
      });
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <header className="border-b">
        <div className="container relative mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </button>
          </div>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold md:text-xl whitespace-nowrap">
            Admin Panel
          </h1>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <ScrollArea className="flex-grow">
        {isLoadingSettings ? (
            <div className="space-y-8 p-6">
              <Skeleton className="w-full h-96" />
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
                <Skeleton className="w-full h-64" />
                <Skeleton className="w-full h-96" />
              </div>
            </div>
        ) : (
          <div className="space-y-8 p-6">
              <StationManagement />
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
                  <div className="space-y-8">
                  <Card>
                      <CardHeader>
                      <CardTitle>Company Settings</CardTitle>
                      <CardDescription>
                          Set the name and logo for your organization.
                      </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input
                            id="company-name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            disabled={isLoadingSettings}
                        />
                      </div>
                      <div>
                        <Label htmlFor="company-logo">Company Logo URL</Label>
                        <Input
                            id="company-logo"
                            placeholder="/logo.png"
                            value={companyLogoUrl}
                            onChange={(e) => setCompanyLogoUrl(e.target.value)}
                            disabled={isLoadingSettings}
                        />
                         <p className="text-xs text-muted-foreground mt-2">
                            <strong>Recommended:</strong> In the file explorer, create a <code className="font-mono bg-muted text-foreground rounded px-1">public</code> folder at the root of your project. Place your logo inside it, then enter its path here (e.g., <code className="font-mono bg-muted text-foreground rounded px-1">/logo.png</code>).
                        </p>
                         <p className="text-xs text-muted-foreground mt-1">
                            <strong>Advanced (less reliable):</strong> You can use public URLs from services like Google Drive, but they may fail to load due to security restrictions. For Google Drive, you must set file sharing to "Anyone with the link" and convert the share link from <code className="font-mono bg-muted text-foreground rounded px-1">.../file/d/FILE_ID/view...</code> to <code className="font-mono bg-muted text-foreground rounded px-1">https://drive.google.com/uc?id=FILE_ID</code>.
                        </p>
                      </div>
                      </CardContent>
                      <CardFooter>
                      <Button onClick={handleCompanySettingsSave} disabled={isLoadingSettings}>
                          Save
                      </Button>
                      </CardFooter>
                  </Card>
                  </div>
                  <div className="space-y-8">
                  <CarouselSettings />
                  </div>
              </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
