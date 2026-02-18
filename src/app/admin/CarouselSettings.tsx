"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlaceHolderImages, ImagePlaceholder } from "@/lib/placeholder-images";
import { Film, Image as ImageIcon, Folder, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DialogType = 'image' | 'video' | null;

export function CarouselSettings() {
  const [openDialog, setOpenDialog] = useState<DialogType>(null);

  const getDialogContent = () => {
    if (!openDialog) return null;
    const isVideo = openDialog === 'video';
    const title = isVideo ? "How to Add a New Video" : "How to Add a New Image";
    const fileExample = isVideo ? "my-video.mp4" : "my-image.jpg";
    const type = isVideo ? "video" : "image";

    const jsonSnippet = JSON.stringify({
        id: "ad-display-new",
        type: type,
        description: `A new advertisement ${type}`,
        imageUrl: `/carousel/${fileExample}`,
        imageHint: "your hint"
    }, null, 2);

    return (
        <>
            <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                    <div className="space-y-4 text-left pt-4">
                        <p>Follow these steps to add new content to your display carousel:</p>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>
                                Place your {type} file (e.g., <code className="font-mono bg-muted text-foreground rounded px-1 py-0.5">{fileExample}</code>) into the <code className="font-mono bg-muted text-foreground rounded px-1 py-0.5">public/carousel</code> folder in your project directory.
                            </li>
                            <li>
                                Open this file in your code editor:<br />
                                <code className="font-mono bg-muted text-foreground rounded px-1 py-0.5 text-sm">src/lib/placeholder-images.json</code>
                            </li>
                            <li>
                                Copy the JSON snippet below and paste it inside the <code className="font-mono bg-muted text-foreground rounded px-1 py-0.5">placeholderImages</code> array in that file.
                            </li>
                             <li>
                                Edit the values for <code className="font-mono bg-muted text-foreground rounded px-1 py-0.5">"id"</code>, <code className="font-mono bg-muted text-foreground rounded px-1 py-0.5">"description"</code>, and <code className="font-mono bg-muted text-foreground rounded px-1 py-0.5">"imageUrl"</code> to match your new file.
                            </li>
                        </ol>
                        <div>
                            <p className="font-medium text-foreground mb-2">Code Snippet to Copy:</p>
                            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto text-foreground">
                                <code>
                                    {jsonSnippet}
                                </code>
                            </pre>
                        </div>
                    </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setOpenDialog(null)}>Got it!</AlertDialogAction>
            </AlertDialogFooter>
        </>
    );
  }

  return (
    <>
        <Card>
          <CardHeader>
            <CardTitle>Carousel Content</CardTitle>
            <CardDescription>Manage images and videos for the public display.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h4 className="font-medium">Current Items</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border rounded-lg p-2 bg-muted/20">
                {(PlaceHolderImages as ImagePlaceholder[]).length > 0 ? (PlaceHolderImages as ImagePlaceholder[]).map(item => {
                     const isVideo = item.type === 'video';
                     return (
                        <div key={item.id} className="flex items-center gap-3 p-2 border rounded-md bg-card">
                            {isVideo ? <Film className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : <ImageIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                            <div className="overflow-hidden">
                                <p className="font-semibold truncate" title={item.description}>{item.description}</p>
                                <p className="text-xs text-muted-foreground truncate" title={item.imageUrl}>{item.imageUrl}</p>
                            </div>
                        </div>
                     )
                }) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 border-dashed border-2 rounded-md">
                        <Folder className="h-8 w-8 mb-2" />
                        <p className="font-semibold">No carousel items found.</p>
                        <p className="text-sm">Click "Add Image" or "Add Video" to get started.</p>
                    </div>
                )}
            </div>
          </CardContent>
           <CardFooter className="flex gap-2 border-t pt-4">
               <Button variant="outline" className="w-full" onClick={() => setOpenDialog('image')}>
                   <PlusCircle className="mr-2" />
                   Add Image
               </Button>
               <Button variant="outline" className="w-full" onClick={() => setOpenDialog('video')}>
                   <PlusCircle className="mr-2" />
                   Add Video
               </Button>
           </CardFooter>
        </Card>

        <AlertDialog open={!!openDialog} onOpenChange={(open) => !open && setOpenDialog(null)}>
            <AlertDialogContent className="max-w-2xl">
              {getDialogContent()}
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}