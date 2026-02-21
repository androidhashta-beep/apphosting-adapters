'use client';

import { useMemo, useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Ticket, Settings, Station } from '@/lib/types';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { NowServing } from './NowServing';
import { InfoPanel } from './InfoPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { Clock } from './Clock';

// Create a context to manage the background music's mute state
type AudioContextType = {
  setBgMusicMuted: (isMuted: boolean) => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};


export function DisplayClient() {
  const { firestore } = useFirebase();
  const router = useRouter();

  const [isBgMusicMuted, setBgMusicMuted] = useState(false);

  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'app') : null),
    [firestore]
  );
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);

  const stationsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'stations') : null),
    [firestore]
  );
  const { data: stations, isLoading: isLoadingStations } = useCollection<Station>(stationsRef);

  const servingTicketIds = useMemo(() => {
    if (!stations) return [];
    return stations.filter(s => s.currentTicketId).map(s => s.currentTicketId as string);
  }, [stations]);

  const servingTicketsQuery = useMemoFirebase(
    () => {
        if (!firestore || servingTicketIds.length === 0) return null;
        return query(collection(firestore, 'tickets'), where('__name__', 'in', servingTicketIds));
    }, [firestore, servingTicketIds]
  );
  const { data: servingTickets, isLoading: isLoadingServingTickets } = useCollection<Ticket>(servingTicketsQuery);

  const servingData = useMemo(() => {
    if (!stations || !servingTickets || !settings) return [];
    
    const servingStations = stations.filter(s => s.currentTicketId);
    
    const data = servingStations.map(station => {
      const ticket = servingTickets.find(t => t.id === station.currentTicketId);
      const service = settings.services.find(s => s.id === ticket?.type);
      return {
        stationName: station.name,
        ticketNumber: ticket?.ticketNumber || '...',
        serviceLabel: service?.label || '...',
        calledAt: ticket?.calledAt,
      };
    }).sort((a, b) => {
        if (!a.calledAt) return 1;
        if (!b.calledAt) return -1;
        return b.calledAt.toMillis() - a.calledAt.toMillis();
    });

    return data;

  }, [stations, servingTickets, settings]);
  
  const isLoading = isLoadingSettings || isLoadingStations || isLoadingServingTickets;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const tracks = useMemo(() => settings?.backgroundMusic || [], [settings]);
  
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.muted = isBgMusicMuted;
    }
  }, [isBgMusicMuted]);

  const playNextTrack = useCallback(() => {
      if (tracks.length > 0) {
          setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % tracks.length);
      }
  }, [tracks.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const playAudio = () => {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Audio playback failed. User interaction may be required.", error);
            });
        }
    };
    
    if (tracks.length > 0 && tracks[currentTrackIndex]) {
        const currentSrc = tracks[currentTrackIndex].url;
        if (audio.src !== currentSrc) {
            audio.src = currentSrc;
            // Listen for when the new audio can be played
            const canPlayListener = () => {
                playAudio();
            };
            audio.addEventListener('canplaythrough', canPlayListener, { once: true });
            audio.load(); // Trigger loading the new source

            return () => {
                audio.removeEventListener('canplaythrough', canPlayListener);
            };
        } else if (audio.paused) {
           // If src is the same but it's paused, try playing
           playAudio();
        }
    }
  }, [tracks, currentTrackIndex]);


  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };
  
  return (
    <AudioContext.Provider value={{ setBgMusicMuted }}>
      <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-sky-400 to-sky-600 text-white font-sans flex flex-col">
        <header className="flex-shrink-0 px-6 py-2 bg-black/30 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
                {settings?.companyLogoUrl && (
                    <div className="relative h-12">
                        <Image 
                            src={settings.companyLogoUrl}
                            alt={`${settings.companyName || 'Company'} Logo`}
                            width={200}
                            height={48}
                            className="h-full w-auto object-contain"
                        />
                    </div>
                )}
                <h1 className="text-3xl font-bold">{settings?.companyName || 'Welcome'}</h1>
            </div>
            <div className="w-1/3 max-w-md">
              <Clock />
            </div>
        </header>
        
        <main className="flex-grow p-4">
        {isLoading ? (
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-4">
                <Skeleton className="bg-slate-700/50" />
                <Skeleton className="bg-slate-700/50" />
                <Skeleton className="bg-slate-700/50" />
                <Skeleton className="bg-slate-700/50" />
            </div>
        ) : (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-4">
            <div className="bg-black/20 rounded-lg overflow-hidden flex flex-col">
              <NowServing servingData={servingData} />
            </div>
            <div className="bg-black/20 rounded-lg overflow-hidden relative">
              <InfoPanel settings={settings} contentType='images'/>
            </div>
            <div className="bg-black/20 rounded-lg overflow-hidden relative">
              <InfoPanel settings={settings} contentType='videos'/>
            </div>
            <div className="bg-black/20 rounded-lg overflow-hidden relative">
              <InfoPanel settings={settings} contentType='all'/>
            </div>
          </div>
        )}
        </main>

        <Button
          onClick={handleGoHome}
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white hover:text-white z-50"
        >
          <Home className="h-6 w-6" />
          <span className="sr-only">Go Home</span>
        </Button>

        {tracks.length > 0 && (
            <audio
                ref={audioRef}
                onEnded={playNextTrack}
                crossOrigin="anonymous"
            />
        )}
      </div>
    </AudioContext.Provider>
  );
}
