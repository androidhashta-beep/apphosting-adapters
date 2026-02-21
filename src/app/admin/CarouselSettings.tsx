
"use client";

import { useState } from "react";
import { useFirebase, useDoc, setDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Settings, ImagePlaceholder, AudioTrack } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Film, Image as ImageIcon, PlusCircle, Music, Trash2, Volume2, VolumeX, Folder, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

type DialogState = {
    type: 'image' | 'video' | 'music';
} | null;

type UrlEntry = {
    id: number;
    url: string;
    status: 'idle' | 'verifying' | 'valid' | 'invalid';
};

export function CarouselSettings() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, "settings", "app") : null), [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);
  
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [itemToDelete, setItemToDelete] = useState<{type: 'image' | 'music', id: string} | null>(null);
  
  const [urlEntries, setUrlEntries] = useState<UrlEntry[]>([]);
  const [description, setDescription] = useState('');
  const [hint, setHint] = useState('');
  const [useOwnAudio, setUseOwnAudio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [urlsInput, setUrlsInput] = useState('');

  const verifyMediaUrl = (url: string, type: 'image' | 'video' | 'music'): Promise<{ url: string; status: 'valid' | 'invalid' }> => {
    return new Promise((resolve) => {
        if (!url || !url.trim() || (!url.startsWith('/') && !url.startsWith('http'))) {
            return resolve({ url, status: 'invalid' });
        }

        let element: HTMLImageElement | HTMLVideoElement | HTMLAudioElement;
        const timeout = 5000;
        let timer: ReturnType<typeof setTimeout>;

        const cleanup = () => {
            clearTimeout(timer);
            if (element) {
                element.onload = null;
                element.onerror = null;
                (element as any).onloadedmetadata = null;
                if ('src' in element) element.src = '';
            }
        };

        const handleSuccess = () => {
            cleanup();
            resolve({ url, status: 'valid' });
        };

        const handleError = () => {
            cleanup();
            resolve({ url, status: 'invalid' });
        };
        
        timer = setTimeout(handleError, timeout);

        if (type === 'image') {
            element = new window.Image();
            element.onload = handleSuccess;
            element.onerror = handleError;
        } else { // video or music
            element = document.createElement(type);
            element.onloadedmetadata = handleSuccess; // Use onloadedmetadata for faster checks on media files
            element.onerror = handleError;
        }
        element.src = url;
    });
  };
  
  const handleAddUrls = () => {
    const urls = urlsInput.split('\n').map(url => url.trim()).filter(url => url);
    const newEntries: UrlEntry[] = urls.map((url, index) => ({
        id: Date.now() + index,
        url,
        status: 'idle',
    }));
    setUrlEntries(prev => [...prev, ...newEntries]);
    setUrlsInput('');
  };

  const handleRemoveUrl = (id: number) => {
      setUrlEntries(prev => prev.filter(entry => entry.id !== id));
  };
  
  const handleCloseDialog = () => {
    setDialogState(null);
    setUrlEntries([]);
    setDescription('');
    setHint('');
    setUseOwnAudio(false);
    setUrlsInput('');
    setIsSaving(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dialogState || !settings || !settingsRef || isSaving) return;

    if (!description) {
        toast({ variant: "destructive", title: "Save Failed", description: "Description field is required." });
        return;
    }
    if (urlEntries.length === 0) {
        toast({ variant: "destructive", title: "Save Failed", description: "Please add at least one URL." });
        return;
    }

    setIsSaving(true);

    const verificationPromises = urlEntries.map(entry => {
        setUrlEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'verifying' } : e));
        return verifyMediaUrl(entry.url, dialogState.type).then(result => ({ ...result, id: entry.id }));
    });

    const results = await Promise.all(verificationPromises);

    let allValid = true;
    results.forEach(result => {
        setUrlEntries(prev => prev.map(e => {
            if (e.id === result.id) {
                if (result.status === 'invalid') allValid = false;
                return { ...e, status: result.status };
            }
            return e;
        }));
    });
    
    if (!allValid) {
        toast({
            variant: "destructive",
            title: "Could Not Load Some Media",
            description: `One or more URLs are invalid. Please remove them and try again.`,
            duration: 10000,
        });
        setIsSaving(false);
        return;
    }

    try {
        const validUrls = urlEntries.map(entry => entry.url);

        if (dialogState.type === 'music') {
            const newTracks: AudioTrack[] = validUrls.map((url, index) => ({
                id: `music-${Date.now()}-${index}`,
                description: validUrls.length > 1 ? `${description} (${index + 1})` : description,
                url,
            }));
            const backgroundMusic = [...(settings.backgroundMusic || []), ...newTracks];
            setDocumentNonBlocking(settingsRef, { backgroundMusic }, { merge: true });
            toast({ title: `${newTracks.length} music track(s) added` });
        } else { // image or video
            const newImages: ImagePlaceholder[] = validUrls.map((url, index) => ({
                id: `${dialogState.type}-${Date.now()}-${index}`,
                type: dialogState.type,
                description: validUrls.length > 1 ? `${description} (${index + 1})` : description,
                imageUrl: url,
                imageHint: hint,
                ...(dialogState.type === 'video' && { useOwnAudio })
            }));
            const placeholderImages = [...(settings.placeholderImages || []), ...newImages];
            setDocumentNonBlocking(settingsRef, { placeholderImages }, { merge: true });
            toast({ title: `${newImages.length} ${dialogState.type}(s) added` });
        }
    } catch(error: any) {
        toast({ variant: "destructive", title: "Save Failed", description: error.message });
        setIsSaving(false);
        return;
    }

    handleCloseDialog();
  };

  const handleDeleteItem = () => {
    if (!itemToDelete || !settings || !settingsRef) return;
    
    if (itemToDelete.type === 'music') {
        const backgroundMusic = (settings.backgroundMusic || []).filter(item => item.id !== itemToDelete.id);
        setDocumentNonBlocking(settingsRef, { backgroundMusic }, { merge: true });
    } else {
        const placeholderImages = (settings.placeholderImages || []).filter(item => item.id !== itemToDelete.id);
        setDocumentNonBlocking(settingsRef, { placeholderImages }, { merge: true });
    }
    
    toast({ title: "Item removed" });
    setItemToDelete(null);
  }

  const renderDialogContent = () => {
    if (!dialogState) return null;
    const isVideo = dialogState.type === 'video';
    const isMusic = dialogState.type === 'music';
    const title = isMusic ? "Add Background Music" : isVideo ? "Add Video(s)" : "Add Image(s)";
    
    return (
        <form onSubmit={handleSave}>
            <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                 <AlertDialogDescription asChild>
                     <div className="space-y-4 text-left pt-4 text-sm text-muted-foreground">
                        <p>
                           Add media by pasting URLs (one per line) into the text box and clicking "Add". Local file paths must start with <code className="font-mono bg-muted text-foreground rounded px-1">/</code> and point to a file in the <code className="font-mono bg-muted text-foreground rounded px-1">public</code> folder.
                        </p>
                    </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="item-description">Description</Label>
                    <Input id="item-description" name="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="A short description for the media item(s)" required />
                    <p className="text-xs text-muted-foreground">If adding multiple items, a number will be appended (e.g., "My Item (1)").</p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="item-urls">File URLs</Label>
                    <div className="flex items-start gap-2">
                        <Textarea id="item-urls" value={urlsInput} onChange={e => setUrlsInput(e.target.value)} placeholder={"/carousel/item1.jpg\n/carousel/item2.mp4\nhttps://drive.google.com/uc?id=YOUR_FILE_ID"} rows={4} />
                        <Button type="button" variant="outline" onClick={handleAddUrls} disabled={!urlsInput.trim()}>Add</Button>
                    </div>
                </div>

                <div className="space-y-2 rounded-lg border bg-muted/20 p-2 min-h-[6rem] max-h-48 overflow-y-auto">
                    {urlEntries.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No URLs added yet.</p>
                    ) : urlEntries.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between gap-2 text-sm p-1.5 rounded-md bg-background border my-1">
                            <div className="flex items-center gap-2.5 min-w-0">
                                {entry.status === 'idle' && <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                                {entry.status === 'verifying' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />}
                                {entry.status === 'valid' && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                                {entry.status === 'invalid' && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                                <span className="truncate" title={entry.url}>{entry.url}</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive flex-shrink-0" onClick={() => handleRemoveUrl(entry.id)} disabled={isSaving}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                {!isMusic && (
                    <div className="space-y-2">
                        <Label htmlFor="item-hint">AI Image Hint (Optional)</Label>
                        <Input id="item-hint" name="hint" value={hint} onChange={e => setHint(e.target.value)} placeholder="e.g., 'training room'" />
                        <p className="text-xs text-muted-foreground">A hint for AI to find a better stock photo later. Applied to all added images.</p>
                    </div>
                )}
                 {isVideo && (
                    <div className="flex items-center space-x-2">
                        <Switch id="useOwnAudio" name="useOwnAudio" checked={useOwnAudio} onCheckedChange={setUseOwnAudio} />
                        <Label htmlFor="useOwnAudio">Play video's own audio (for all added videos)</Label>
                    </div>
                )}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel type="button" onClick={handleCloseDialog}>Cancel</AlertDialogCancel>
                <AlertDialogAction type="submit" disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying & Saving...
                        </>
                    ) : 'Verify & Save'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </form>
    )
  }

  return (
    <>
        <Card>
          <CardHeader>
            <CardTitle>Carousel Content</CardTitle>
            <CardDescription>Manage images and videos for the public display. Changes are saved automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 pr-2 border rounded-lg p-2 bg-muted/20 max-h-96 overflow-y-auto">
                {isLoadingSettings ? <p>Loading...</p> : (settings?.placeholderImages || []).length > 0 ? settings?.placeholderImages.map(item => {
                     const isVideo = item.type === 'video';
                     return (
                        <div key={item.id} className="flex items-center justify-between gap-3 p-2 border rounded-md bg-card">
                            <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                                {isVideo ? <Film className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : <ImageIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                                <div className="overflow-hidden">
                                    <p className="font-semibold truncate" title={item.description}>{item.description}</p>
                                    <p className="text-xs text-muted-foreground truncate" title={item.imageUrl}>{item.imageUrl}</p>
                                </div>
                            </div>
                             <div className="flex items-center flex-shrink-0">
                                {isVideo && (
                                    <Badge variant={item.useOwnAudio ? "secondary" : "outline"} className="mr-2">
                                        {item.useOwnAudio ? <Volume2 className="mr-1 h-3 w-3" /> : <VolumeX className="mr-1 h-3 w-3" />}
                                        {item.useOwnAudio ? 'Sound On' : 'Muted'}
                                    </Badge>
                                )}
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => setItemToDelete({type: 'image', id: item.id})}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                     )
                }) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 border-dashed border-2 rounded-md">
                        <Folder className="h-8 w-8 mb-2" />
                        <p className="font-semibold">No carousel items found.</p>
                        <p className="text-sm">Add images or videos to get started.</p>
                    </div>
                )}
            </div>
          </CardContent>
           <CardFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4">
               <Button variant="outline" className="w-full" onClick={() => setDialogState({type: 'image'})} disabled={isLoadingSettings}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Add Image(s)
               </Button>
               <Button variant="outline" className="w-full" onClick={() => setDialogState({type: 'video'})} disabled={isLoadingSettings}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Add Video(s)
               </Button>
           </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Background Music</CardTitle>
                <CardDescription>Manage music for the public display carousel.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 pr-2 border rounded-lg p-2 bg-muted/20 max-h-72 overflow-y-auto">
                    {isLoadingSettings ? <p>Loading...</p> : (settings?.backgroundMusic || []).length > 0 ? settings.backgroundMusic.map(track => (
                        <div key={track.id} className="flex items-center justify-between gap-3 p-2 border rounded-md bg-card">
                           <div className="flex items-center gap-3 overflow-hidden">
                                <Music className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div className="overflow-hidden">
                                    <p className="font-semibold truncate" title={track.description}>{track.description}</p>
                                    <p className="text-xs text-muted-foreground truncate" title={track.url}>{track.url}</p>
                                </div>
                            </div>
                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8 flex-shrink-0" onClick={() => setItemToDelete({type: 'music', id: track.id})}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 border-dashed border-2 rounded-md">
                            <Music className="h-8 w-8 mb-2" />
                            <p className="font-semibold">No music found.</p>
                            <p className="text-sm">Add music tracks to play during the carousel.</p>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setDialogState({type: 'music'})} disabled={isLoadingSettings}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Music Track(s)
                </Button>
            </CardFooter>
        </Card>

        <AlertDialog open={!!dialogState} onOpenChange={(open) => !open && handleCloseDialog()}>
            <AlertDialogContent>
              {renderDialogContent()}
            </AlertDialogContent>
        </AlertDialog>
        
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently remove the media item from the carousel. This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
