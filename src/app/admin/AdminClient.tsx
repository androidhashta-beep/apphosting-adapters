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

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || '');
    }
  }, [settings]);

  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };

  const handleCompanyNameSave = () => {
    if (settingsRef) {
      setDocumentNonBlocking(settingsRef, { companyName }, { merge: true });
      toast({
        title: 'Settings Saved',
        description: 'Company name has been updated.',
      });
    }
  };
  
  const isHydrated = !isLoadingSettings;

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
        <div className="space-y-8 p-6">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Company Settings</CardTitle>
                  <CardDescription>
                    Set the name of your organization.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={!isHydrated}
                  />
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCompanyNameSave} disabled={!isHydrated}>
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
      </ScrollArea>
    </div>
  );
}
