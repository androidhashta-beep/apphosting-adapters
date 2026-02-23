
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
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
  useAuth,
} from '@/firebase';
import { doc } from 'firebase/firestore';
import { StationManagement } from './StationManagement';
import { CarouselSettings } from './CarouselSettings';
import { UserManagement } from './UserManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { signOut } from 'firebase/auth';
import { OperationalSuggestions } from './OperationalSuggestions';

export function AdminClient() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const auth = useAuth();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'app') : null),
    [firestore]
  );
  const { data: settings, isLoading: isLoadingSettings } =
    useDoc<Settings>(settingsRef);
    
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(50);
  const [logoUrlStatus, setLogoUrlStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [logoUrlError, setLogoUrlError] = useState<string | null>(null);

  const verifyUrl = useCallback((url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setLogoUrlStatus('idle');
      setLogoUrlError(null);
      return;
    }

    const isHttp = trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');
    const isLocal = trimmedUrl.startsWith('/');
    const isFileSystemPath = trimmedUrl.includes('/home/') || trimmedUrl.includes('/Users/') || /^[a-zA-Z]:\\/.test(trimmedUrl);

    if (!isHttp && !isLocal) {
        setLogoUrlStatus('invalid');
        setLogoUrlError("URL must start with '/' (for local files) or 'http'.");
        return;
    }

    if (isLocal && isFileSystemPath) {
        setLogoUrlStatus('invalid');
        setLogoUrlError("Invalid path. For local files, use the path from the 'public' folder (e.g., '/video.mp4'), not the full file system path.");
        return;
    }
    
    setLogoUrlStatus('verifying');
    setLogoUrlError(null);
    const img = new window.Image();
    img.onload = () => setLogoUrlStatus('valid');
    img.onerror = () => {
        setLogoUrlStatus('invalid');
        setLogoUrlError("Could not load image. Check if the URL is correct and publicly accessible.");
    }
    img.src = encodeURI(url);
  }, []);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || '');
      setCompanyLogoUrl(settings.companyLogoUrl || '');
      setBackgroundMusicVolume((settings.backgroundMusicVolume ?? 0.5) * 100);
    }
  }, [settings]);

  useEffect(() => {
    if (companyLogoUrl === (settings?.companyLogoUrl || '')) {
        setLogoUrlStatus('idle');
        setLogoUrlError(null);
        return;
    }

    const handler = setTimeout(() => {
        verifyUrl(companyLogoUrl);
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [companyLogoUrl, verifyUrl, settings?.companyLogoUrl]);
  
  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };

  const handleSignOut = async () => {
    await signOut(auth);
    handleGoHome();
  };

  const handleCompanySettingsSave = () => {
    if (logoUrlStatus !== 'valid' && companyLogoUrl.trim() !== '') {
        toast({
            variant: "destructive",
            title: 'Cannot Save',
            description: 'The company logo URL is invalid. Please fix it before saving.'
        });
        return;
    }
    if (settingsRef) {
      const settingsToSave = {
        companyName,
        companyLogoUrl,
        backgroundMusicVolume: backgroundMusicVolume / 100,
      };
      setDocumentNonBlocking(settingsRef, settingsToSave, { merge: true });
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
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sign Out / Change Role</span>
            </Button>
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
              <OperationalSuggestions />
              <UserManagement />
              <StationManagement />
              <CarouselSettings />
              <div className="grid grid-cols-1 items-start gap-8">
                  <div className="space-y-8">
                  <Card>
                      <CardHeader>
                      <CardTitle>Company Settings</CardTitle>
                      <CardDescription>
                          Set the name, logo, and other global settings for your organization.
                      </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
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
                        <div className="relative">
                            <Input
                                id="company-logo"
                                placeholder="/logo.png"
                                value={companyLogoUrl}
                                onChange={(e) => setCompanyLogoUrl(e.target.value)}
                                disabled={isLoadingSettings}
                                className="pr-10"
                            />
                             <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                {logoUrlStatus === 'verifying' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                {logoUrlStatus === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {logoUrlStatus === 'invalid' && <AlertCircle className="h-4 w-4 text-destructive" />}
                            </div>
                        </div>
                        {logoUrlError && <p className="text-xs text-destructive mt-1">{logoUrlError}</p>}
                         <p className="text-xs text-muted-foreground mt-2">
                            <strong>Recommended:</strong> In the file explorer, use the <code className="font-mono bg-muted text-foreground rounded px-1">public</code> folder (all lowercase) located at the top level of your project (alongside the `src` folder). Place your logo inside it, then enter its <strong>URL path</strong> here. The path must start with a forward slash (e.g., <code className="font-mono bg-muted text-foreground rounded px-1">/logo.png</code>). Next.js requires the folder to be named `public` in all lowercase.
                        </p>
                         <p className="text-xs text-muted-foreground mt-1">
                            <strong>Advanced (less reliable):</strong> You can use public URLs from services like Google Drive, but they may fail to load due to security restrictions. For Google Drive, you must set file sharing to "Anyone with the link" and convert the share link from <code className="font-mono bg-muted text-foreground rounded px-1">.../file/d/FILE_ID/view...</code> to <code className="font-mono bg-muted text-foreground rounded px-1">https://drive.google.com/uc?id=FILE_ID</code>.
                        </p>
                      </div>
                       <div>
                        <Label htmlFor="music-volume">Background Music Volume</Label>
                        <div className="flex items-center gap-4 pt-2">
                          <Slider
                            id="music-volume"
                            min={0}
                            max={100}
                            step={1}
                            value={[backgroundMusicVolume]}
                            onValueChange={(value) => setBackgroundMusicVolume(value[0])}
                            disabled={isLoadingSettings}
                          />
                          <span className="text-sm font-medium w-12 text-center">{backgroundMusicVolume}%</span>
                        </div>
                         <p className="text-xs text-muted-foreground mt-2">
                          Controls the master volume for background music on the public display.
                        </p>
                      </div>
                      </CardContent>
                      <CardFooter>
                      <Button onClick={handleCompanySettingsSave} disabled={isLoadingSettings}>
                          Save Settings
                      </Button>
                      </CardFooter>
                  </Card>
                  </div>
              </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
