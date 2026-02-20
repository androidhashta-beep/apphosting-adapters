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
  const { firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();
  
  const settingsRef = useMemoFirebase(() => (firestore && !isUserLoading ? doc(firestore, "settings", "app") : null), [firestore, isUserLoading]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);
  
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [itemToDelete, setItemToDelete] = useState<{type: 'image' | 'music', id: string} | null>(null);

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dialogState || !settings || !settingsRef) return;
    
    const formData = new FormData(e.currentTarget);
    const id = `${dialogState.type}-${Date.now()}`;
    
    try {
        if (dialogState.type === 'music') {
            const newTrack: AudioTrack = {
                id,
                description: formData.get('description') as string,
                url: formData.get('url') as string,
            };
            if (!newTrack.description || !newTrack.url) throw new Error("Description and URL are required.");
            const backgroundMusic = [...(settings.backgroundMusic || []), newTrack];
            setDocumentNonBlocking(settingsRef, { backgroundMusic }, { merge: true });
            toast({ title: "Music track added" });
        } else { // image or video
             const newImage: ImagePlaceholder = {
                id,
                type: dialogState.type,
                description: formData.get('description') as string,
                imageUrl: formData.get('url') as string,
                imageHint: formData.get('hint') as string,
                ...(dialogState.type === 'video' && { useOwnAudio: (formData.get('useOwnAudio') === 'on') })
            };
            if (!newImage.description || !newImage.imageUrl) throw new Error("Description and URL are required.");
            const placeholderImages = [...(settings.placeholderImages || []), newImage];
            setDocumentNonBlocking(settingsRef, { placeholderImages }, { merge: true });
            toast({ title: `${dialogState.type === 'video' ? 'Video' : 'Image'} added` });
        }
    } catch(error: any) {
        toast({ variant: "destructive", title: "Save Failed", description: error.message });
        return;
    }
    setDialogState(null);
  }

  const handleDeleteItem = () => {
    if (!itemToDelete || !settings || !settingsRef) return;
    
    if (itemToDelete.type === 'music') {
        const backgroundMusic = settings.backgroundMusic.filter(item => item.id !== itemToDelete.id);
        setDocumentNonBlocking(settingsRef, { backgroundMusic }, { merge: true });
    } else {
        const placeholderImages = settings.placeholderImages.filter(item => item.id !== itemToDelete.id);
        setDocumentNonBlocking(settingsRef, { placeholderImages }, { merge: true });
    }
    
    toast({ title: "Item removed" });
    setItemToDelete(null);
  }

  const renderDialogContent = () => {
    if (!dialogState) return null;
    const isVideo = dialogState.type === 'video';
    const isMusic = dialogState.type === 'music';
    const title = isMusic ? "Add Background Music" : isVideo ? "Add Video" : "Add Image";
    const fileExample = isMusic ? "my-song.mp3" : isVideo ? "my-video.mp4" : "my-image.jpg";
    const type = isMusic ? "music" : isVideo ? "video" : "image";
    
    return (
        <form onSubmit={handleSaveItem}>
            <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                     <div className="space-y-4 text-left pt-4 text-sm text-muted-foreground">
                        <p>
                            First, place your file (e.g., <code className="font-mono bg-muted text-foreground rounded px-1">{fileExample}</code>) into the <code className="font-mono bg-muted text-foreground rounded px-1">public/carousel</code> folder in your project directory.
                        </p>
                         <p>
                            Then, fill out the details below. The URL should be the path relative to the public folder, like <code className="font-mono bg-muted text-foreground rounded px-1">/carousel/{fileExample}</code>.
                        </p>
                    </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="item-description">Description</Label>
                    <Input id="item-description" name="description" placeholder={`A short description of the ${type}`} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="item-url">File URL</Label>
                    <Input id="item-url" name="url" placeholder={`/carousel/${fileExample}`} required />
                </div>
                {!isMusic && (
                    <div className="space-y-2">
                        <Label htmlFor="item-hint">AI Image Hint (Optional)</Label>
                        <Input id="item-hint" name="hint" placeholder="e.g., 'training room'" />
                        <p className="text-xs text-muted-foreground">A hint for AI to find a better stock photo later.</p>
                    </div>
                )}
                 {isVideo && (
                    <div className="flex items-center space-x-2">
                        <Switch id="useOwnAudio" name="useOwnAudio" />
                        <Label htmlFor="useOwnAudio">Play video's own audio</Label>
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

  const isHydrated = !isLoadingSettings && !isUserLoading;

  return (
    <>
        <Card>
          <CardHeader>
            <CardTitle>Carousel Content</CardTitle>
            <CardDescription>Manage images and videos for the public display. Changes are saved automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 pr-2 border rounded-lg p-2 bg-muted/20 max-h-96 overflow-y-auto">
                {!isHydrated ? <p>Loading...</p> : (settings?.placeholderImages || []).length > 0 ? settings?.placeholderImages.map(item => {
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
               <Button variant="outline" className="w-full" onClick={() => setDialogState({type: 'image'})} disabled={!isHydrated}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Add Image
               </Button>
               <Button variant="outline" className="w-full" onClick={() => setDialogState({type: 'video'})} disabled={!isHydrated}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Add Video
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
                    {!isHydrated ? <p>Loading...</p> : (settings?.backgroundMusic || []).length > 0 ? settings.backgroundMusic.map(track => (
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
                <Button variant="outline" className="w-full" onClick={() => setDialogState({type: 'music'})} disabled={!isHydrated}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Music
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
