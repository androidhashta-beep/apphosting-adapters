"use client";

import { useState, useEffect, useRef, useCallback, SyntheticEvent } from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { type EmblaCarouselType } from 'embla-carousel-react'
import { Icon } from "@/lib/icons";

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
import type { ImagePlaceholder, AudioTrack } from "@/lib/types";

export function AdCarousel({ adItems = [], backgroundMusic = [] }: { adItems: ImagePlaceholder[], backgroundMusic: AudioTrack[] }) {
  const canAutoplay = adItems.length > 1;

  const [api, setApi] = useState<CarouselApi>();

  // State for shuffled music playlist and current track index
  const [shuffledMusic, setShuffledMusic] = useState<AudioTrack[]>([]);
  const [bgMusicIndex, setBgMusicIndex] = useState(0);

  const [isBgMuted, setIsBgMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const bgAudioRef = useRef<HTMLAudioElement>(null);

  const autoplayPlugin = useRef(
    Autoplay({ delay: 12000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  // Memoized shuffle function
  const shuffleArray = useCallback((array: AudioTrack[]) => {
    if (!array || array.length === 0) return [];
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  // Shuffle the music list on initial load
  useEffect(() => {
    setShuffledMusic(shuffleArray(backgroundMusic));
  }, [shuffleArray, backgroundMusic]);

  const handleAudioForSlide = useCallback((currentApi?: EmblaCarouselType) => {
    if (!bgAudioRef.current) return;

    let shouldPlayBgMusic = true;
    if (currentApi) {
        const selectedIndex = currentApi.selectedScrollSnap();
        const selectedItem = adItems[selectedIndex];
        if (selectedItem?.type === 'video' && selectedItem.useOwnAudio) {
            shouldPlayBgMusic = false;
        }
    }

    if (shouldPlayBgMusic) {
      if (bgAudioRef.current.paused && !bgAudioRef.current.muted) {
        const playPromise = bgAudioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Background audio playback failed. This may be due to browser policy or a loading error.", error);
            });
        }
      }
    } else {
      bgAudioRef.current.pause();
    }
  }, [adItems]);

  useEffect(() => {
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
    if (backgroundMusic.length <= 1) return; // Don't shuffle if there's only one song

    setBgMusicIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      // If we've played all songs in the shuffled list, reshuffle and start over
      if (nextIndex >= shuffledMusic.length) {
        setShuffledMusic(shuffleArray(backgroundMusic));
        return 0;
      }
      return nextIndex;
    });
  };

  // When the track changes, try to play the new one
  useEffect(() => {
    if (bgAudioRef.current) {
        bgAudioRef.current.load();
        handleAudioForSlide(api);
    }
  }, [bgMusicIndex, shuffledMusic, api, handleAudioForSlide]);

  useEffect(() => {
    if (bgAudioRef.current) {
        setIsBgMuted(bgAudioRef.current.muted);
    }
  }, []);

  const handleMediaError = (e: SyntheticEvent<HTMLAudioElement | HTMLVideoElement | HTMLImageElement>) => {
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
          handleAudioForSlide(api);
      }
    }
  };
  
  const currentTrack = shuffledMusic[bgMusicIndex];

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
        {backgroundMusic.length > 0 && (
            <Button variant="outline" size="icon" onClick={toggleMute} className="bg-background/50 hover:bg-background/80">
                {isBgMuted ? <Icon name="VolumeX" /> : <Icon name="Volume2" />}
                <span className="sr-only">Toggle Background Music</span>
            </Button>
        )}
        {canAutoplay && (
            <Button variant="outline" size="icon" onClick={togglePlay} className="bg-background/50 hover:bg-background/80">
                {isPlaying ? <Icon name="Pause" /> : <Icon name="Play" />}
                <span className="sr-only">Toggle Autoplay</span>
            </Button>
        )}
      </div>
      {backgroundMusic.length > 0 && currentTrack && (
          <audio
            ref={bgAudioRef}
            src={currentTrack.url}
            onEnded={handleBgMusicEnded}
            loop={backgroundMusic.length === 1}
            onError={handleMediaError}
            />
      )}
    </div>
  );
}
