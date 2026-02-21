'use client';
import { useState, useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import type { Settings, ImagePlaceholder } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { useAudio } from './DisplayClient';

type InfoPanelProps = {
  settings: Settings | null;
  contentType: 'images' | 'videos' | 'all';
}

export function InfoPanel({ settings, contentType }: InfoPanelProps) {
  const { setBgMusicMuted } = useAudio();
  const [shuffledItems, setShuffledItems] = useState<ImagePlaceholder[]>([]);

  // Client-side shuffle to avoid hydration mismatch & have different carousels
  useEffect(() => {
    const items = settings?.placeholderImages || [];
  
    const filteredItems = items.filter(item => {
      if (contentType === 'images') return item.type === 'image';
      if (contentType === 'videos') return item.type === 'video';
      if (contentType === 'all') return true;
      return false;
    });

    // Fisher-Yates shuffle algorithm
    const shuffle = (array: ImagePlaceholder[]) => {
      let currentIndex = array.length, randomIndex;
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex], array[currentIndex]];
      }
      return array;
    }
    
    setShuffledItems(shuffle([...filteredItems]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, contentType]);

  const handleVideoStateChange = (isPlaying: boolean, hasOwnAudio: boolean) => {
    if (hasOwnAudio) {
      setBgMusicMuted(isPlaying);
    }
  };

  const displayItems = shuffledItems;

  return (
    <Carousel
        className="absolute inset-0 h-full w-full"
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]}
        opts={{ loop: true }}
    >
        <CarouselContent className="h-full">
            {displayItems.length > 0 ? displayItems.map((item) => (
                <CarouselItem key={item.id} className="h-full">
                    <Card className="h-full w-full overflow-hidden bg-transparent border-none">
                        <CardContent className="relative h-full w-full p-0">
                            {item.type === 'video' ? (
                                <video 
                                  src={item.imageUrl} 
                                  autoPlay 
                                  loop 
                                  muted={!item.useOwnAudio} 
                                  className="h-full w-full object-cover"
                                  onPlay={() => handleVideoStateChange(true, !!item.useOwnAudio)}
                                  onPause={() => handleVideoStateChange(false, !!item.useOwnAudio)}
                                  onEnded={() => handleVideoStateChange(false, !!item.useOwnAudio)}
                                />
                            ) : (
                                <Image
                                    src={item.imageUrl}
                                    alt={item.description}
                                    fill
                                    className="object-cover"
                                    sizes="50vw"
                                />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-center">
                                <p className="font-bold text-white truncate">{item.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                </CarouselItem>
            )) : (
                 <CarouselItem className="h-full">
                     <Card className="h-full w-full overflow-hidden bg-transparent border-none flex items-center justify-center">
                         <CardContent className="p-0 text-center">
                             <p className="text-white/70">No promotional content.</p>
                         </CardContent>
                     </Card>
                </CarouselItem>
            )}
        </CarouselContent>
    </Carousel>
  );
}
