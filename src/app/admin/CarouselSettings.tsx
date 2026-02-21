
"use client";

import { useState, useMemo, useCallback } from 'react';
import type { Settings, ImagePlaceholder, AudioTrack } from '@/lib/types';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Trash2,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

// New component for managing a single media item
function MediaItem({
  item,
  index,
  total,
  onDelete,
  onMove,
  isLoading,
}: {
  item: ImagePlaceholder;
  index: number;
  total: number;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg bg-background">
      <img
        src={item.imageUrl}
        alt={item.description}
        className="w-16 h-16 object-cover rounded-md"
      />
      <div className="flex-grow">
        <p className="font-semibold truncate">{item.description}</p>
        <p className="text-xs text-muted-foreground truncate">{item.imageUrl}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMove(item.id, 'up')}
          disabled={index === 0 || isLoading}
          aria-label="Move up"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMove(item.id, 'down')}
          disabled={index === total - 1 || isLoading}
          aria-label="Move down"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(item.id)}
          disabled={isLoading}
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// New component for managing a single audio track
function AudioTrackItem({
  track,
  onDelete,
  isLoading,
}: {
  track: AudioTrack;
  onDelete: (id: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg bg-background">
      <div className="flex-grow">
        <p className="font-semibold truncate">{track.description}</p>
        <p className="text-xs text-muted-foreground truncate">{track.url}</p>
      </div>
      <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(track.id)}
          disabled={isLoading}
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
    </div>
  );
}

export function CarouselSettings() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'app') : null),
    [firestore]
  );
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);

  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [isAudioDialogOpen, setIsAudioDialogOpen] = useState(false);
  
  const [newMediaDescription, setNewMediaDescription] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaHint, setNewMediaHint] = useState('');
  const [mediaUrlStatus, setMediaUrlStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [mediaUrlError, setMediaUrlError] = useState<string | null>(null);

  const [newAudioDescription, setNewAudioDescription] = useState('');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [audioUrlStatus, setAudioUrlStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [audioUrlError, setAudioUrlError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const verifyUrl = useCallback((url: string, setStatus: (s: 'idle' | 'verifying' | 'valid' | 'invalid') => void, setError: (e: string | null) => void) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setStatus('idle');
      setError(null);
      return;
    }

    const isHttp = trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');
    const isLocal = trimmedUrl.startsWith('/');
    const isFileSystemPath = trimmedUrl.includes('/home/') || /^[a-zA-Z]:\\/.test(trimmedUrl);

    if (!isHttp && !isLocal) {
        setStatus('invalid');
        setError("URL must start with '/' (for local files) or 'http'.");
        return;
    }

    if (isLocal && isFileSystemPath) {
        setStatus('invalid');
        setError("Invalid path. Use path from 'public' folder, e.g., '/logo.png', not a full file system path.");
        return;
    }
    
    setStatus('verifying');
    setError(null);

    const mediaElement = new window.Image(); // Use Image for both image and video to check loadability
    mediaElement.onload = () => setStatus('valid');
    mediaElement.onerror = () => {
        setStatus('invalid');
        setError("Could not load media. Check if the URL is correct and the file is publicly accessible.");
    }
    mediaElement.src = encodeURI(trimmedUrl);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
        if (newMediaUrl) verifyUrl(newMediaUrl, setMediaUrlStatus, setMediaUrlError);
    }, 500);
    return () => clearTimeout(handler);
  }, [newMediaUrl, verifyUrl]);

  useEffect(() => {
    const handler = setTimeout(() => {
        if (newAudioUrl) verifyUrl(newAudioUrl, setAudioUrlStatus, setAudioUrlError);
    }, 500);
    return () => clearTimeout(handler);
  }, [newAudioUrl, verifyUrl]);

  const handleDataUpdate = async (updateFn: (currentSettings: Settings | null) => Partial<Settings>) => {
    if (!firestore || !settingsRef) return;
    setIsSaving(true);
    try {
      await runTransaction(firestore, async (transaction) => {
        const settingsDoc = await transaction.get(settingsRef);
        const currentData = settingsDoc.exists() ? (settingsDoc.data() as Settings) : null;
        const updatedData = updateFn(currentData);
        
        if (settingsDoc.exists()) {
          transaction.update(settingsRef, updatedData);
        } else {
          transaction.set(settingsRef, updatedData);
        }
      });
      toast({
        title: 'Settings Updated',
        description: 'Your changes have been saved.',
      });
    } catch (error: any) {
       let title = "Save Failed";
       let description = "An unexpected error occurred. Please try again.";

       if (error.code === 'unavailable' || error.code === 'network-request-failed') {
            title = "CRITICAL: Connection Blocked by Firewall";
            description = "The application cannot connect to the local database because your PC's firewall is blocking it. Please allow the app through your firewall.";
       } else if (error.code === 'permission-denied') {
            title = 'Permission Denied';
            description = 'You do not have permission to perform this action.';
       }
        
       toast({
        variant: 'destructive',
        title: title,
        description: description,
        duration: 20000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMedia = async () => {
    if (!newMediaDescription.trim() || !newMediaUrl.trim()) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a description and a URL.' });
      return;
    }
    if (mediaUrlStatus !== 'valid') {
       toast({ variant: 'destructive', title: 'Invalid Media URL', description: 'Please fix the URL before saving.' });
       return;
    }
    const newMedia: ImagePlaceholder = {
      id: `media-${Date.now()}`,
      description: newMediaDescription,
      imageUrl: newMediaUrl,
      imageHint: newMediaHint,
      type: 'image', // This should be determined by the URL or a user selection
    };
    
    await handleDataUpdate((currentSettings) => ({
        placeholderImages: [...(currentSettings?.placeholderImages || []), newMedia]
    }));

    setNewMediaDescription('');
    setNewMediaUrl('');
    setNewMediaHint('');
    setMediaUrlStatus('idle');
    setIsMediaDialogOpen(false);
  };

  const handleDeleteMedia = (id: string) => {
    handleDataUpdate((currentSettings) => ({
        placeholderImages: (currentSettings?.placeholderImages || []).filter(item => item.id !== id)
    }));
  };

  const handleMoveMedia = (id: string, direction: 'up' | 'down') => {
    handleDataUpdate((currentSettings) => {
        const items = [...(currentSettings?.placeholderImages || [])];
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return {};
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return {};
        const [movedItem] = items.splice(index, 1);
        items.splice(newIndex, 0, movedItem);
        return { placeholderImages: items };
    });
  };
  
  const handleAddAudio = async () => {
    if (!newAudioDescription.trim() || !newAudioUrl.trim()) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a description and a URL.' });
      return;
    }
     if (audioUrlStatus !== 'valid') {
       toast({ variant: 'destructive', title: 'Invalid Audio URL', description: 'Please fix the URL before saving.' });
       return;
    }

    const newAudio: AudioTrack = {
      id: `audio-${Date.now()}`,
      description: newAudioDescription,
      url: newAudioUrl,
    };
    
    await handleDataUpdate((currentSettings) => ({
        backgroundMusic: [...(currentSettings?.backgroundMusic || []), newAudio]
    }));

    setNewAudioDescription('');
    setNewAudioUrl('');
    setAudioUrlStatus('idle');
    setIsAudioDialogOpen(false);
  };

  const handleDeleteAudio = (id: string) => {
    handleDataUpdate((currentSettings) => ({
        backgroundMusic: (currentSettings?.backgroundMusic || []).filter(track => track.id !== id)
    }));
  };
  
  const isLoading = isLoadingSettings || isSaving;

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
         {/* Carousel Content Card */}
        <Card>
          <CardHeader>
            <CardTitle>Carousel Content</CardTitle>
            <CardDescription>
              Manage images and videos shown on the public display. Recommended size: 1920x1080 pixels, under 1MB for images, under 10MB for videos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <div className="space-y-2 pr-4">
                {isLoading && (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                )}
                {!isLoading &&
                  settings?.placeholderImages?.map((item, index) => (
                    <MediaItem
                      key={item.id}
                      item={item}
                      index={index}
                      total={settings.placeholderImages.length}
                      onDelete={handleDeleteMedia}
                      onMove={handleMoveMedia}
                      isLoading={isSaving}
                    />
                  ))}
                 {!isLoading && (!settings?.placeholderImages || settings.placeholderImages.length === 0) && (
                    <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground">
                        <p>No media added yet.</p>
                        <p className="text-xs">Click "Add Media" to get started.</p>
                    </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => setIsMediaDialogOpen(true)}
              disabled={isLoading}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Media
            </Button>
          </CardFooter>
        </Card>

        {/* Background Music Card */}
        <Card>
          <CardHeader>
            <CardTitle>Background Music</CardTitle>
            <CardDescription>
              Manage audio tracks for the public display.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <ScrollArea className="h-72">
              <div className="space-y-2 pr-4">
                {isLoading && (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                )}
                 {!isLoading &&
                  settings?.backgroundMusic?.map((track) => (
                    <AudioTrackItem
                      key={track.id}
                      track={track}
                      onDelete={handleDeleteAudio}
                      isLoading={isSaving}
                    />
                  ))}
                {!isLoading && (!settings?.backgroundMusic || settings.backgroundMusic.length === 0) && (
                     <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground">
                        <p>No music added yet.</p>
                        <p className="text-xs">Click "Add Audio" to get started.</p>
                    </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => setIsAudioDialogOpen(true)}
              disabled={isLoading}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Audio
            </Button>
          </CardFooter>
        </Card>
      </div>

       {/* Add Media Dialog */}
      <Dialog
        open={isMediaDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setNewMediaUrl(''); 
            setMediaUrlStatus('idle');
            setMediaUrlError(null);
            setNewMediaDescription('');
            setNewMediaHint('');
          }
          setIsMediaDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Media</DialogTitle>
            <DialogDescription>
             Add a new image or video to the public display carousel. 
            </DialogDescription>
             <div className="text-xs text-muted-foreground pt-2">
                <p className="font-bold">Instructions for Local Files:</p>
                <ol className="list-decimal list-inside space-y-1 mt-1">
                    <li>In the file explorer on the left, find the `public` folder at the top level of your project.</li>
                    <li>Drag and drop your image or video file into that `public` folder.</li>
                    <li>Enter the URL path for the file here. The path must start with a forward slash (`/`).</li>
                </ol>
                <p className="mt-2">
                    <strong>Example:</strong> If your file is `my-video.mp4` inside `public`, you would enter `/my-video.mp4`.
                </p>
                <p className="text-destructive font-bold mt-2">
                    DO NOT use the full file system path like `/home/user/...` or `C:\...`.
                </p>
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="media-desc" className="text-right">
                Description
              </Label>
              <Input
                id="media-desc"
                value={newMediaDescription}
                onChange={(e) => setNewMediaDescription(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Company Announcement"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="media-url" className="text-right">
                URL
              </Label>
               <div className="col-span-3 relative">
                <Input
                    id="media-url"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="/my-image.png or https://..."
                    className="pr-10"
                />
                 <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {mediaUrlStatus === 'verifying' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {mediaUrlStatus === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {mediaUrlStatus === 'invalid' && <AlertCircle className="h-4 w-4 text-destructive" />}
                </div>
              </div>
            </div>
             {mediaUrlError && <p className="col-span-4 text-xs text-destructive -mt-2 text-center">{mediaUrlError}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleAddMedia}
              disabled={isSaving || newMediaUrl.trim() === '' || mediaUrlStatus !== 'valid'}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       {/* Add Audio Dialog */}
      <Dialog open={isAudioDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setNewAudioUrl('');
            setAudioUrlStatus('idle');
            setAudioUrlError(null);
            setNewAudioDescription('');
          }
          setIsAudioDialogOpen(open);
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Background Music</DialogTitle>
            <DialogDescription>
              Add a new audio track to play on the public display. Use local files from the `/public` folder or a public URL.
            </DialogDescription>
          </DialogHeader>
           <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="audio-desc" className="text-right">
                Description
              </Label>
              <Input
                id="audio-desc"
                value={newAudioDescription}
                onChange={(e) => setNewAudioDescription(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Relaxing instrumental"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="audio-url" className="text-right">
                URL
              </Label>
              <div className="col-span-3 relative">
                <Input
                    id="audio-url"
                    value={newAudioUrl}
                    onChange={(e) => setNewAudioUrl(e.target.value)}
                    placeholder="/music.mp3 or https://..."
                    className="pr-10"
                />
                 <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {audioUrlStatus === 'verifying' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {audioUrlStatus === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {audioUrlStatus === 'invalid' && <AlertCircle className="h-4 w-4 text-destructive" />}
                </div>
              </div>
            </div>
            {audioUrlError && <p className="col-span-4 text-xs text-destructive -mt-2 text-center">{audioUrlError}</p>}
          </div>
          <DialogFooter>
             <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleAddAudio}
              disabled={isSaving || newAudioUrl.trim() === '' || audioUrlStatus !== 'valid'}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
