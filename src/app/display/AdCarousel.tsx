"use client";

import * as React from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel, { type EmblaCarouselType } from 'embla-carousel-react'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlaceholder, PlaceHolderImages, BackgroundMusic } from "@/lib/placeholder-images";

export function AdCarousel() {
  const adItems = PlaceHolderImages.filter(p => p.id.startsWith('ad-display-'));
  const canAutoplay = adItems.length > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: canAutoplay },
    canAutoplay ? [Autoplay({ delay: 5000, stopOnInteraction: true })] : []
  );
  
  const [bgMusicIndex, setBgMusicIndex] = React.useState(0);
  const bgAudioRef = React.useRef<HTMLAudioElement>(null);

  const handleSelect = React.useCallback((api: EmblaCarouselType) => {
    if (!api || !bgAudioRef.current || adItems.length === 0) return;

    const selectedIndex = api.selectedScrollSnap();
    const selectedItem = adItems[selectedIndex];

    if (selectedItem?.type === 'video' && selectedItem.useOwnAudio) {
        bgAudioRef.current.pause();
    } else {
        if (bgAudioRef.current.paused) {
            bgAudioRef.current.play().catch(e => console.error("Error playing background audio:", e));
        }
    }
  }, [adItems]);

  React.useEffect(() => {
    if (!emblaApi) return;
    handleSelect(emblaApi);
    emblaApi.on('select', handleSelect);
    emblaApi.on('destroy', () => emblaApi.off('select', handleSelect));
  }, [emblaApi, handleSelect]);

  const handleBgMusicEnded = () => {
    if (BackgroundMusic.length > 0) {
      setBgMusicIndex(prevIndex => (prevIndex + 1) % BackgroundMusic.length);
    }
  };
  
  React.useEffect(() => {
      if (bgAudioRef.current && BackgroundMusic.length > 0) {
          bgAudioRef.current.play().catch(e => console.error("Error playing background audio:", e));
      }
  }, [bgMusicIndex])


  const onMouseEnter = React.useCallback(() => {
    if (canAutoplay) {
      emblaApi?.plugins()?.autoplay?.stop();
    }
  }, [emblaApi, canAutoplay]);

  const onMouseLeave = React.useCallback(() => {
    if (canAutoplay) {
      emblaApi?.plugins()?.autoplay?.play();
    }
  }, [emblaApi, canAutoplay]);


  return (
    <>
      <Carousel
        ref={emblaRef}
        className="w-full h-full"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <CarouselContent className="h-full">
          {adItems.length > 0 ? (adItems as ImagePlaceholder[]).map((item) => {
            const isVideo = item.type === 'video';

            return (
              <CarouselItem key={item.id} className="h-full">
                <Card className="h-full overflow-hidden">
                  <CardContent className="relative h-full p-0">
                    {isVideo ? (
                      <video
                        src={item.imageUrl}
                        autoPlay
                        loop
                        muted={!item.useOwnAudio}
                        playsInline
                        className="w-full h-full object-cover"
                        data-ai-hint={item.imageHint}
                      >
                          Your browser does not support the video tag.
                      </video>
                    ) : (
                      <Image
                        src={item.imageUrl}
                        alt={item.description}
                        fill
                        sizes="100%"
                        className="object-cover"
                        data-ai-hint={item.imageHint}
                      />
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            )
          }) : (
              <CarouselItem>
                  <Card className="h-full flex items-center justify-center bg-muted">
                      <CardContent className="p-0">
                          <p className="text-muted-foreground">No advertisements to display.</p>
                      </CardContent>
                  </Card>
              </CarouselItem>
          )}
        </CarouselContent>
      </Carousel>
      {BackgroundMusic.length > 0 && (
          <audio 
            ref={bgAudioRef} 
            src={BackgroundMusic[bgMusicIndex]?.url}
            onEnded={handleBgMusicEnded}
            autoPlay
            loop={BackgroundMusic.length === 1}
            />
      )}
    </>
  );
}
