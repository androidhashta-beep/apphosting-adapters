
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
import { Film, Image as ImageIcon, PlusCircle, Music, Trash2, Volume2, VolumeX, Folder } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

type DialogState = {
    type: 'image' | 'video' | 'music';
} | null;

export function CarouselSettings() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, "settings", "app") : null), [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);
  
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [itemToDelete, setItemToDelete] = useState<{type: 'image' | 'music', id: string} | null>(null);

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dialogState || !settings || !settingsRef) return;

    const formData = new FormData(e.currentTarget);
    const description = formData.get('description') as string;
    const urlsInput = formData.get('urls') as string;
    const hint = formData.get('hint') as string;
    const useOwnAudio = formData.get('useOwnAudio') === 'on';

    if (!description || !urlsInput) {
        toast({ variant: "destructive", title: "Save Failed", description: "Description and URLs are required." });
        return;
    }

    const urls = urlsInput.split('\n').map(url => url.trim()).filter(url => url);

    if (urls.length === 0) {
        toast({ variant: "destructive", title: "Save Failed", description: "Please provide at least one valid URL." });
        return;
    }

    try {
        if (dialogState.type === 'music') {
            const newTracks: AudioTrack[] = urls.map((url, index) => ({
                id: `music-${Date.now()}-${index}`,
                description: urls.length > 1 ? `${description} (${index + 1})` : description,
                url,
            }));
            const backgroundMusic = [...(settings.backgroundMusic || []), ...newTracks];
            setDocumentNonBlocking(settingsRef, { backgroundMusic }, { merge: true });
            toast({ title: `${newTracks.length} music track(s) added` });
        } else { // image or video
            const newImages: ImagePlaceholder[] = urls.map((url, index) => ({
                id: `${dialogState.type}-${Date.now()}-${index}`,
                type: dialogState.type,
                description: urls.length > 1 ? `${description} (${index + 1})` : description,
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
        return;
    }
    setDialogState(null);
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
    const title = isMusic ? "Add Background Music Track(s)" : isVideo ? "Add Video(s)" : "Add Image(s)";
    const type = isMusic ? "music track" : isVideo ? "video" : "image";
    
    return (
        <form onSubmit={handleSaveItem}>
            <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                     <div className="space-y-4 text-left pt-4 text-sm text-muted-foreground">
                        <p>
                           <strong>Recommended:</strong> In the file explorer, create a <code className="font-mono bg-muted text-foreground rounded px-1">public</code> folder at the top level of your project (alongside the `src` folder). Inside `public`, create another folder named <code className="font-mono bg-muted text-foreground rounded px-1">carousel</code>. Upload your media there, then add their paths below (e.g., <code className="font-mono bg-muted text-foreground rounded px-1">/carousel/my-video.mp4</code>).
                        </p>
                         <p>
                            <strong>Advanced (less reliable):</strong> You can use public URLs from services like Google Drive, but they may fail to load due to security restrictions. For Google Drive, set sharing to "Anyone with the link" and convert the link from <code className="font-mono bg-muted text-foreground rounded px-1">.../file/d/FILE_ID/view...</code> to <code className="font-mono bg-muted text-foreground rounded px-1">https://drive.google.com/uc?id=FILE_ID</code>.
                        </p>
                    </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="item-description">Description</Label>
                    <Input id="item-description" name="description" placeholder={`A short description for the ${type}(s)`} required />
                    <p className="text-xs text-muted-foreground">If adding multiple items, a number will be appended to each description (e.g., "My Item (1)").</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="item-urls">File URLs (one per line)</Label>
                    <Textarea id="item-urls" name="urls" placeholder={"/carousel/item1.jpg\n/carousel/item2.mp4\nhttps://drive.google.com/uc?id=YOUR_FILE_ID"} required rows={5} />
                </div>
                {!isMusic && (
                    <div className="space-y-2">
                        <Label htmlFor="item-hint">AI Image Hint (Optional)</Label>
                        <Input id="item-hint" name="hint" placeholder="e.g., 'training room'" />
                        <p className="text-xs text-muted-foreground">A hint for AI to find a better stock photo later. Applied to all added images.</p>
                    </div>
                )}
                 {isVideo && (
                    <div className="flex items-center space-x-2">
                        <Switch id="useOwnAudio" name="useOwnAudio" />
                        <Label htmlFor="useOwnAudio">Play video's own audio (for all added videos)</Label>
                    </div>
                )}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel type="button" onClick={() => setDialogState(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction type="submit">Save</AlertDialogAction>
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

        <AlertDialog open={!!dialogState} onOpenChange={(open) => !open && setDialogState(null)}>
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
