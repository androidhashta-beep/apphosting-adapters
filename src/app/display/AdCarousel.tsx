"use client";

import * as React from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { type EmblaCarouselType } from 'embla-carousel-react'
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder, PlaceHolderImages, BackgroundMusic } from "@/lib/placeholder-images";

export function AdCarousel() {
  const adItems = PlaceHolderImages;
  const canAutoplay = adItems.length > 1;

  const [api, setApi] = React.useState<CarouselApi>();
  const [bgMusicIndex, setBgMusicIndex] = React.useState(0);
  const [isBgMuted, setIsBgMuted] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const bgAudioRef = React.useRef<HTMLAudioElement>(null);

  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 12000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const handleAudioForSlide = React.useCallback((currentApi: EmblaCarouselType) => {
    if (!currentApi || !bgAudioRef.current) return;

    const selectedIndex = currentApi.selectedScrollSnap();
    const selectedItem = adItems[selectedIndex];

    if (selectedItem?.type === 'video' && selectedItem.useOwnAudio) {
      bgAudioRef.current.pause();
    } else {
      if (bgAudioRef.current.paused && !bgAudioRef.current.muted) {
        const playPromise = bgAudioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Background audio playback failed. This may be due to browser policy or a loading error.", error);
            });
        }
      }
    }
  }, [adItems]);

  React.useEffect(() => {
    if (!api) return;

    const onPlay = () => setIsPlaying(true);
    const onStop = () => setIsPlaying(false);

    const autoplay = autoplayPlugin.current;
    if (autoplay) {
      setIsPlaying(autoplay.isPlaying());
      api.on('autoplay:play', onPlay);
      api.on('autoplay:stop', onStop);
    }

    handleAudioForSlide(api); // On init
    api.on('select', handleAudioForSlide); // On slide change

    return () => {
      api.off('select', handleAudioForSlide);
      if (autoplay) {
        api.off('autoplay:play', onPlay);
        api.off('autoplay:stop', onStop);
      }
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

  React.useEffect(() => {
    if (bgAudioRef.current) {
        setIsBgMuted(bgAudioRef.current.muted);
    }
  }, []);

  const handleMediaError = (e: React.SyntheticEvent<HTMLAudioElement | HTMLVideoElement | HTMLImageElement>) => {
      console.warn(`A media element failed to load and has been hidden. Source: ${'src' in e.currentTarget ? e.currentTarget.src : 'unknown'}`);
      if (e.currentTarget.parentElement) {
        e.currentTarget.parentElement.style.display = 'none';
      }
  };

  const togglePlay = () => {
    const autoplay = autoplayPlugin.current;
    if (!autoplay) return;
    if (autoplay.isPlaying()) {
      autoplay.stop();
    } else {
      autoplay.play();
    }
  };

  const toggleMute = () => {
    if (bgAudioRef.current) {
      const newMuted = !bgAudioRef.current.muted;
      bgAudioRef.current.muted = newMuted;
      setIsBgMuted(newMuted);

      if (!newMuted && bgAudioRef.current.paused) {
          bgAudioRef.current.play().catch(e => console.warn("Failed to play on unmute", e));
      }
    }
  };

  return (
    <div className="relative w-full h-full">
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
                        controls
                        className="w-full h-full object-cover"
                        data-ai-hint={item.imageHint}
                        onError={handleMediaError}
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
                        onError={handleMediaError}
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
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
      </Carousel>
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        {BackgroundMusic.length > 0 && (
            <Button variant="outline" size="icon" onClick={toggleMute} className="bg-background/50 hover:bg-background/80">
                {isBgMuted ? <VolumeX /> : <Volume2 />}
                <span className="sr-only">Toggle Background Music</span>
            </Button>
        )}
        {canAutoplay && (
            <Button variant="outline" size="icon" onClick={togglePlay} className="bg-background/50 hover:bg-background/80">
                {isPlaying ? <Pause /> : <Play />}
                <span className="sr-only">Toggle Autoplay</span>
            </Button>
        )}
      </div>
      {BackgroundMusic.length > 0 && (
          <audio
            ref={bgAudioRef}
            src={BackgroundMusic[bgMusicIndex]?.url}
            onEnded={handleBgMusicEnded}
            loop={BackgroundMusic.length === 1}
            onError={handleMediaError}
            />
      )}
    </div>
  );
}
