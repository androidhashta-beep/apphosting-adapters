"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Film, Image as ImageIcon, Info, Folder } from "lucide-react";

export function CarouselSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carousel Content</CardTitle>
        <CardDescription>Manage local images and videos for the public display.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
                <p className="font-semibold">How to update content for offline playback:</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Add your image or video files to the <code className="font-mono bg-blue-200/50 dark:bg-blue-900/50 rounded px-1 py-0.5">public/carousel</code> folder in your project.</li>
                    <li>Edit the <code className="font-mono bg-blue-200/50 dark:bg-blue-900/50 rounded px-1 py-0.5">src/lib/placeholder-images.json</code> file to add, remove, or change items.</li>
                    <li>Make sure the <code className="font-mono">imageUrl</code> for each item matches the path to your file (e.g., <code className="font-mono">"/carousel/my-video.mp4"</code>).</li>
                </ol>
                <p className="mt-2">Changes will appear after you refresh the display page.</p>
            </div>
        </div>

        <h4 className="font-medium">Current Items</h4>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {PlaceHolderImages.length > 0 ? PlaceHolderImages.map(item => {
                 const isVideo = ['.mp4', '.webm', '.ogg'].some(ext => item.imageUrl.endsWith(ext));
                 return (
                    <div key={item.id} className="flex items-center gap-3 p-2 border rounded-md">
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
                    <p className="text-sm">Add content to <code className="text-xs">public/carousel</code> and update the JSON file.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
