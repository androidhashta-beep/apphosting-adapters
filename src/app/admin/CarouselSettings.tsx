
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
import { Film, Image as ImageIcon, PlusCircle, Music, Trash2, Volume2, VolumeX, Folder, Loader2, CheckCircle, AlertCircle, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


type DialogState = {
    type: 'image' | 'video' | 'music';
} | null;

export function CarouselSettings() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, "settings", "app") : null), [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);
  
  const carouselItems = settings?.placeholderImages || [];
  const musicTracks = settings?.backgroundMusic || [];

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const dragMusicItem = useRef<number | null>(null);
  const dragOverMusicItem = useRef<number | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [itemToDelete, setItemToDelete] = useState<{type: 'image' | 'music', id: string} | null>(null);
  
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [hint, setHint] = useState('');
  const [useOwnAudio, setUseOwnAudio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageUrlStatus, setImageUrlStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');

  const verifyMediaUrl = useCallback((url: string, type: 'image' | 'video' | 'music') => {
    if (!url || !url.trim() || (!url.startsWith('/') && !url.startsWith('http'))) {
        setImageUrlStatus('idle');
        return;
    }
    
    setImageUrlStatus('verifying');
    const encodedUrl = encodeURI(url);

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
        setImageUrlStatus('valid');
    };

    const handleError = () => {
        cleanup();
        setImageUrlStatus('invalid');
    };
    
    timer = setTimeout(handleError, timeout);

    if (type === 'image') {
        element = new window.Image();
        element.onload = handleSuccess;
        element.onerror = handleError;
        element.src = encodedUrl;
    } else { // video or music
        element = document.createElement(type === 'video' ? 'video' : 'audio');
        element.onloadedmetadata = handleSuccess;
        element.onerror = handleError;
        element.src = encodedUrl;
    }
  }, []);

  useEffect(() => {
    if (!dialogState) return;

    if (imageUrl === '') {
        setImageUrlStatus('idle');
        return;
    }

    const handler = setTimeout(() => {
        verifyMediaUrl(imageUrl, dialogState.type === 'music' ? 'music' : (dialogState.type === 'video' ? 'video' : 'image'));
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [imageUrl, dialogState, verifyMediaUrl]);
  
  const handleCloseDialog = () => {
    setDialogState(null);
    setDescription('');
    setImageUrl('');
    setHint('');
    setUseOwnAudio(false);
    setIsSaving(false);
    setImageUrlStatus('idle');
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dialogState || !settingsRef || !firestore || isSaving || imageUrlStatus !== 'valid') {
        if (imageUrlStatus !== 'valid') {
             toast({ variant: "destructive", title: "Invalid URL", description: "Please provide a valid and accessible URL." });
        }
        return;
    }

    setIsSaving(true);

    try {
        const settingsDoc = await getDoc(settingsRef);
        const currentData = settingsDoc.exists() ? settingsDoc.data() : {};

        const isMusic = dialogState.type === 'music';
        const fieldToUpdate = isMusic ? 'backgroundMusic' : 'placeholderImages';
        
        const newItem = isMusic 
            ? { id: `music-${Date.now()}`, description, url: imageUrl }
            : {
                id: `${dialogState.type}-${Date.now()}`,
                type: dialogState.type,
                description,
                imageUrl,
                imageHint: hint,
                ...(dialogState.type === 'video' && { useOwnAudio })
            };

        const currentItems = currentData[fieldToUpdate] || [];
        if (!Array.isArray(currentItems)) {
            throw new Error(`Database field '${fieldToUpdate}' is in an unexpected format.`);
        }
        
        const updatedItems = [...currentItems, newItem];
        
        await setDoc(settingsRef, { [fieldToUpdate]: updatedItems }, { merge: true });
        
        toast({ title: "Success!", description: "Media item added." });
        handleCloseDialog();

    } catch (error: any) {
        console.error("Save failed:", error);
        toast({ 
            variant: "destructive", 
            title: "Save Failed", 
            description: error.message || "An unknown error occurred. Please check the console for details.",
            duration: 10000
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete || !settingsRef || !firestore) return;

    const isMusic = itemToDelete.type === 'music';
    const fieldToUpdate = isMusic ? 'backgroundMusic' : 'placeholderImages';
    
    try {
        const settingsDoc = await getDoc(settingsRef);
        if (!settingsDoc.exists()) {
            setItemToDelete(null);
            return;
        }

        const currentData = settingsDoc.data();
        const existingItems = currentData[fieldToUpdate];

        if (Array.isArray(existingItems)) {
            const updatedItems = existingItems.filter((item: any) => item.id !== itemToDelete.id);
            await setDoc(settingsRef, { [fieldToUpdate]: updatedItems }, { merge: true });
            toast({ title: "Item removed" });
        }
    } catch(error: any) {
        console.error("Delete failed:", error);
        toast({ 
            variant: "destructive", 
            title: "Delete Failed", 
            description: error.message || "An unknown error occurred.",
            duration: 10000
        });
    } finally {
        setItemToDelete(null);
    }
  }

  const handleDrop = async (newItems: (ImagePlaceholder | AudioTrack)[], field: 'placeholderImages' | 'backgroundMusic') => {
    if (!settingsRef || !firestore) return;
    try {
        await setDoc(settingsRef, { [field]: newItems }, { merge: true });
        toast({ title: "Order saved" });
    } catch (error: any) {
        console.error("Reorder failed:", error);
        toast({ 
            variant: "destructive", 
            title: "Save Failed", 
            description: error.message || "An unknown error occurred while saving the new order.",
            duration: 10000
        });
    }
  };

  const handleCarouselDragStart = (index: number, id: string) => {
    dragItem.current = index;
    setDraggedItemId(id);
  };
  const handleCarouselDragEnter = (index: number) => {
    dragOverItem.current = index;
  };
  const handleCarouselDrop = async () => {
    setDraggedItemId(null);
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const currentItems = [...carouselItems];
    const draggedItemContent = currentItems.splice(dragItem.current, 1)[0];
    currentItems.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    await handleDrop(currentItems, 'placeholderImages');
  };

  const handleMusicDragStart = (index: number, id: string) => {
    dragMusicItem.current = index;
    setDraggedItemId(id);
  };
  const handleMusicDragEnter = (index: number) => {
    dragOverMusicItem.current = index;
  };
  const handleMusicDrop = async () => {
    setDraggedItemId(null);
    if (dragMusicItem.current === null || dragOverMusicItem.current === null) return;
    if (dragMusicItem.current === dragOverMusicItem.current) return;

    const currentTracks = [...musicTracks];
    const draggedTrackContent = currentTracks.splice(dragMusicItem.current, 1)[0];
    currentTracks.splice(dragOverMusicItem.current, 0, draggedTrackContent);

    dragMusicItem.current = null;
    dragOverMusicItem.current = null;

    await handleDrop(currentTracks, 'backgroundMusic');
  };

  const renderDialogContent = () => {
    if (!dialogState) return null;
    const isVideo = dialogState.type === 'video';
    const isMusic = dialogState.type === 'music';
    const title = isMusic ? "Add Background Music" : isVideo ? "Add Video" : "Add Image";
    const urlLabel = isMusic ? "File URL" : "Image/Video URL";
    
    return (
        <form onSubmit={handleSave}>
            <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                 <AlertDialogDescription asChild>
                     <div className="space-y-4 text-left pt-4 text-sm text-muted-foreground">
                        <p>
                           Provide a URL for your media file. Local files must start with <code className="font-mono bg-muted text-foreground rounded px-1">/</code> and point to a file in the <code className="font-mono bg-muted text-foreground rounded px-1">public</code> folder. The URL will be verified automatically.
                        </p>
                    </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="item-description">Description</Label>
                    <Input id="item-description" name="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="A short description for the media item" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="item-url">{urlLabel}</Label>
                    <div className="relative">
                        <Input
                            id="item-url"
                            name="url"
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                            placeholder="/carousel/item.jpg or https://..."
                            required
                            className="pr-10"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            {imageUrlStatus === 'verifying' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            {imageUrlStatus === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {imageUrlStatus === 'invalid' && <AlertCircle className="h-4 w-4 text-destructive" />}
                        </div>
                    </div>
                    {imageUrlStatus === 'invalid' && <p className="text-xs text-destructive mt-1">Could not load media. Check if the URL is correct and publicly accessible.</p>}
                </div>

                {!isMusic && (
                    <div className="space-y-2">
                        <Label htmlFor="item-hint">AI Image Hint (Optional)</Label>
                        <Input id="item-hint" name="hint" value={hint} onChange={e => setHint(e.target.value)} placeholder="e.g., 'training room'" />
                        <p className="text-xs text-muted-foreground">A hint for AI to find a better stock photo later.</p>
                    </div>
                )}
                 {isVideo && (
                    <div className="flex items-center space-x-2">
                        <Switch id="useOwnAudio" name="useOwnAudio" checked={useOwnAudio} onCheckedChange={setUseOwnAudio} />
                        <Label htmlFor="useOwnAudio">Play video's own audio</Label>
                    </div>
                )}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel type="button" onClick={handleCloseDialog}>Cancel</AlertDialogCancel>
                <AlertDialogAction type="submit" disabled={isSaving || imageUrlStatus !== 'valid'}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? 'Saving...' : 'Save'}
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
            <CardDescription>Manage and reorder images and videos for the public display.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 pr-2 border rounded-lg p-2 bg-muted/20 max-h-96 overflow-y-auto">
                {isLoadingSettings ? <p>Loading...</p> : carouselItems.length > 0 ? carouselItems.map((item, index) => {
                     const isVideo = item.type === 'video';
                     return (
                        <div 
                            key={item.id} 
                            className={cn(
                                "flex items-center justify-between gap-3 p-2 border rounded-md bg-card cursor-grab active:cursor-grabbing transition-opacity",
                                draggedItemId === item.id && "opacity-30"
                            )}
                            draggable
                            onDragStart={() => handleCarouselDragStart(index, item.id)}
                            onDragEnter={() => handleCarouselDragEnter(index)}
                            onDragEnd={handleCarouselDrop}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
                   <PlusCircle className="mr-2 h-4 w-4" /> Add Image
               </Button>
               <Button variant="outline" className="w-full" onClick={() => setDialogState({type: 'video'})} disabled={isLoadingSettings}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Add Video
               </Button>
           </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Background Music</CardTitle>
                <CardDescription>Manage and reorder music for the public display.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 pr-2 border rounded-lg p-2 bg-muted/20 max-h-72 overflow-y-auto">
                    {isLoadingSettings ? <p>Loading...</p> : musicTracks.length > 0 ? musicTracks.map((track, index) => (
                        <div 
                            key={track.id} 
                            className={cn(
                                "flex items-center justify-between gap-3 p-2 border rounded-md bg-card cursor-grab active:cursor-grabbing transition-opacity",
                                draggedItemId === track.id && "opacity-30"
                            )}
                            draggable
                            onDragStart={() => handleMusicDragStart(index, track.id)}
                            onDragEnter={() => handleMusicDragEnter(index)}
                            onDragEnd={handleMusicDrop}
                            onDragOver={(e) => e.preventDefault()}
                        >
                           <div className="flex items-center gap-3 overflow-hidden">
                                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Music Track
                </Button>
            </CardFooter>
        </Card>

        <AlertDialog open={!!dialogState} onOpenChange={(open) => !open && handleCloseDialog()}>
            <AlertDialogContent className="sm:max-w-xl">
              {renderDialogContent()}
            </AlertDialogContent>
        </AlertDialog>
        
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently remove the media item. This cannot be undone.</AlertDialogDescription>
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

    