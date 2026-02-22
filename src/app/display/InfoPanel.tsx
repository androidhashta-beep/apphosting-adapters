
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import type { Settings, ImagePlaceholder, AudioTrack } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Skeleton } from '@/components/ui/skeleton';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type InfoPanelProps = {
  mediaItems: ImagePlaceholder[] | null;
  backgroundMusic: AudioTrack[] | null;
  autoplayDelay: number;
  isAnnouncing: boolean;
  masterVolume: number;
  loop?: boolean;
}

function VideoPlayer({ src, isMuted, onEnded }: { src: string; isMuted: boolean, onEnded: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        // Autoplay was prevented.
        console.warn("Video autoplay was prevented.", error);
      });
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      key={src} // Important to re-mount the video element on src change
      className="absolute top-0 left-0 w-full h-full object-cover"
      onEnded={onEnded}
      playsInline
      autoPlay
      muted={isMuted}
    >
      <source src={encodeURI(src)} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}


export function InfoPanel({ mediaItems, backgroundMusic, autoplayDelay, isAnnouncing, masterVolume, loop = false }: InfoPanelProps) {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicPlaylist = useRef<AudioTrack[]>([]);
  const currentTrackIndex = useRef(0);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle background music shuffling and playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !backgroundMusic || backgroundMusic.length === 0) {
      return;
    }

    const shuffleAndPlay = () => {
        musicPlaylist.current = [...backgroundMusic].sort(() => Math.random() - 0.5);
        currentTrackIndex.current = 0;
        playTrack(currentTrackIndex.current);
    }
    
    const playTrack = (index: number) => {
        if (!musicPlaylist.current[index]) return;
        audio.src = encodeURI(musicPlaylist.current[index].url);
        if (!isAudioMuted) {
            audio.play().catch(e => console.error("Audio play failed:", e));
        }
    }

    const playNextTrack = () => {
      currentTrackIndex.current++;
      if (currentTrackIndex.current >= musicPlaylist.current.length) {
        shuffleAndPlay(); // Reshuffle and start over
      } else {
        playTrack(currentTrackIndex.current);
      }
    };
    
    shuffleAndPlay(); // Initial shuffle

    const handleError = () => {
        console.error('Audio error:', audio.error);
        toast({
            variant: "destructive",
            title: 'Background Music Error',
            description: `Could not play track: ${audio.currentSrc}. Skipping.`,
            duration: 10000,
        });
        setTimeout(playNextTrack, 2000); // Try next track after a delay
    };

    audio.addEventListener('ended', playNextTrack);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', playNextTrack);
      audio.removeEventListener('error', handleError);
    };

  }, [backgroundMusic, toast, isAudioMuted]);


  // Handle volume changes (ducking and master volume)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isAudioMuted) {
        if (!audio.paused) {
            audio.pause();
        }
    } else {
        const targetVolume = isAnnouncing ? Math.max(0, masterVolume * 0.2) : masterVolume;
        audio.volume = targetVolume;
        if (audio.paused && backgroundMusic && backgroundMusic.length > 0) {
             audio.play().catch(e => console.warn("Could not play audio:", e));
        }
    }
  }, [isAudioMuted, isAnnouncing, masterVolume, backgroundMusic]);


  if (!isClient || !mediaItems) {
    return <Skeleton className="bg-slate-700/50 h-full w-full rounded-lg" />;
  }
  
  if (mediaItems.length === 0) {
     return (
        <div className="h-full w-full bg-black/20 rounded-lg flex items-center justify-center text-center text-slate-300 flex-col p-4">
             <h3 className="font-bold text-lg">
                No Media Content
             </h3>
             <p className="text-sm mt-1">There is no content to display in this panel.</p>
        </div>
     );
  }

  return (
    <div className="relative h-full w-full bg-black/20 rounded-lg overflow-hidden">
        <Carousel
            className="w-full h-full"
            opts={{
              loop: loop,
            }}
            plugins={[
            Autoplay({
                delay: autoplayDelay,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
            }),
            ]}
        >
            <CarouselContent className="h-full">
            {mediaItems.map((item) => (
                <CarouselItem key={item.id} className="relative w-full h-full">
                   {item.type === 'video' ? (
                       <VideoPlayer 
                          src={item.imageUrl} 
                          isMuted={!item.useOwnAudio || isAnnouncing} 
                          onEnded={() => { /* Need carousel API to advance */ }} />
                   ) : (
                       <Image
                            src={encodeURI(item.imageUrl)}
                            alt={item.description}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                   )}
                </CarouselItem>
            ))}
            </CarouselContent>
        </Carousel>
         {backgroundMusic && backgroundMusic.length > 0 && (
            <>
                <audio ref={audioRef} />
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white hover:text-white"
                    onClick={() => setIsAudioMuted(prev => !prev)}
                >
                    {isAudioMuted ? <VolumeX /> : <Volume2 />}
                    <span className="sr-only">Mute/Unmute Music</span>
                </Button>
            </>
        )}
    </div>
  );
}
