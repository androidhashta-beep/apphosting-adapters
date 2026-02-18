"use client";

import * as React from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { type EmblaCarouselType } from 'embla-carousel-react'

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlaceholder, PlaceHolderImages, BackgroundMusic } from "@/lib/placeholder-images";

export function AdCarousel() {
  const adItems = PlaceHolderImages.filter(p => p.id.startsWith('ad-display-'));
  const canAutoplay = adItems.length > 1;

  const [api, setApi] = React.useState<CarouselApi>();
  const [bgMusicIndex, setBgMusicIndex] = React.useState(0);
  const bgAudioRef = React.useRef<HTMLAudioElement>(null);

  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  const handleAudioForSlide = React.useCallback((currentApi: EmblaCarouselType) => {
    if (!currentApi || !bgAudioRef.current) return;

    const selectedIndex = currentApi.selectedScrollSnap();
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
    if (!api) return;

    handleAudioForSlide(api); // On init
    api.on('select', handleAudioForSlide); // On slide change

    return () => {
      api.off('select', handleAudioForSlide);
    };
  }, [api, handleAudioForSlide]);

  const handleBgMusicEnded = () => {
    if (BackgroundMusic.length > 0) {
      setBgMusicIndex(prevIndex => (prevIndex + 1) % BackgroundMusic.length);
    }
  };

  // Start playing audio when the component mounts or the track changes
  React.useEffect(() => {
    if (bgAudioRef.current && api) {
        handleAudioForSlide(api);
    }
  }, [bgMusicIndex, api, handleAudioForSlide]);


  return (
    <>
      <Carousel
        setApi={setApi}
        plugins={canAutoplay ? [autoplayPlugin.current] : []}
        opts={{ loop: canAutoplay }}
        className="w-full h-full"
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
