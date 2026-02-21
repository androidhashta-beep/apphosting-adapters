
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import type { Settings, ImagePlaceholder } from '@/lib/types';
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
  settings: Settings | null;
  contentType: 'images' | 'videos' | 'all';
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
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}


export function InfoPanel({ settings, contentType }: InfoPanelProps) {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const mediaItems = useMemo(() => {
    if (!settings?.placeholderImages) return [];
    
    let filteredItems = settings.placeholderImages;
    
    if (contentType === 'images') {
      filteredItems = filteredItems.filter(item => item.type === 'image');
    } else if (contentType === 'videos') {
      filteredItems = filteredItems.filter(item => item.type === 'video');
    }

    return filteredItems;
  }, [settings, contentType]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle background music
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !settings?.backgroundMusic || settings.backgroundMusic.length === 0) {
      return;
    }

    let currentTrackIndex = 0;
    
    const playNextTrack = () => {
      if (!settings?.backgroundMusic || settings.backgroundMusic.length === 0) return;
      currentTrackIndex = (currentTrackIndex + 1) % settings.backgroundMusic.length;
      audio.src = settings.backgroundMusic[currentTrackIndex].url;
      audio.play().catch(e => console.error("Audio play failed:", e));
    };

    audio.src = settings.backgroundMusic[currentTrackIndex].url;
    audio.addEventListener('ended', playNextTrack);
    audio.addEventListener('error', (e) => {
        console.error('Audio error:', audio.error);
        toast({
            variant: "destructive",
            title: 'Background Music Error',
            description: `Could not play track: ${audio.currentSrc}. Check URL and permissions.`,
            duration: 10000,
        });
        // Try next track after a short delay
        setTimeout(playNextTrack, 5000);
    });

    if (!isAudioMuted) {
      audio.play().catch(e => console.error("Audio play failed on initial load:", e));
    }

    return () => {
      audio.removeEventListener('ended', playNextTrack);
    };

  }, [settings?.backgroundMusic, isAudioMuted, toast]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.muted = isAudioMuted;
        if (!isAudioMuted) {
            audioRef.current.play().catch(e => console.warn("Could not play audio:", e));
        } else {
            audioRef.current.pause();
        }
    }
  }, [isAudioMuted]);


  if (!isClient || !settings) {
    return <Skeleton className="bg-slate-700/50 h-full w-full rounded-lg" />;
  }
  
  if (mediaItems.length === 0) {
     return (
        <div className="h-full w-full bg-black/20 rounded-lg flex items-center justify-center text-center text-slate-300 flex-col p-4">
             <h3 className="font-bold text-lg">
                {contentType === 'images' && 'No Images'}
                {contentType === 'videos' && 'No Videos'}
                {contentType === 'all' && 'No Media Content'}
             </h3>
             <p className="text-sm mt-1">The administrator has not added any content of this type.</p>
        </div>
     );
  }

  return (
    <div className="relative h-full w-full bg-black/20 rounded-lg overflow-hidden">
        <Carousel
            className="w-full h-full"
            plugins={[
            Autoplay({
                delay: 5000,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
            }),
            ]}
        >
            <CarouselContent>
            {mediaItems.map((item, index) => (
                <CarouselItem key={index} className="relative w-full h-full">
                   {item.type === 'video' ? (
                       <VideoPlayer src={item.imageUrl} isMuted={item.useOwnAudio ? false : isAudioMuted} onEnded={() => { /* Need carousel API to advance */ }} />
                   ) : (
                       <Image
                            src={item.imageUrl}
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
         {settings.backgroundMusic && settings.backgroundMusic.length > 0 && (
            <>
                <audio ref={audioRef} loop={settings.backgroundMusic.length === 1} />
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
