'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Ticket, Settings, Station, Service } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirebase, useMemoFirebase } from '@/firebase/provider';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';
import { NowServing } from './NowServing';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Home, PlayCircle } from 'lucide-react';
import { Clock } from './Clock';
import { InfoPanel } from './InfoPanel';
import { useToast } from '@/hooks/use-toast';
import { useTtsQueue } from '@/hooks/useTtsQueue';

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function DisplayClient() {
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // TTS Queue with browser TTS primary, Gemini API fallback
  const { announce, hasBrowserTts } = useTtsQueue({
    isStarted,
    onPlayStart: () => setIsAnnouncing(true),
    onPlayEnd: () => setIsAnnouncing(false),
  });

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

  const allTicketsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'tickets') : null),
    [firestore]
  );
  const { data: allTickets, isLoading: isLoadingAllTickets } = useCollection<Ticket>(allTicketsQuery);

  const servingTickets = useMemo(() => {
    if (!allTickets || !stations) return [];
    const servingTicketIds = stations.filter(s => s.currentTicketId).map(s => s.currentTicketId);
    return allTickets.filter(t => servingTicketIds.includes(t.id));
  }, [allTickets, stations]);

  const waitingTickets = useMemo(() => {
    if (!allTickets) return [];
    return allTickets
      .filter((t) => t.status === 'waiting')
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : null);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : null);
        if (dateA && dateB) return dateA.getTime() - dateB.getTime();
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      });
  }, [allTickets]);

  const serviceMap = useMemo(() => {
    if (!settings?.services) return new Map<string, string>();
    return new Map(settings.services.map(s => [s.id, s.label]));
  }, [settings?.services]);

  const servingData = useMemo(() => {
    if (!stations || !servingTickets || !settings?.services) return [];
    
    const servingStations = stations.filter(s => s.currentTicketId);
    
    const data = servingStations.map(station => {
      const ticket = servingTickets.find(t => t.id === station.currentTicketId);
      const service = settings.services?.find(s => s.id === ticket?.type);
      return {
        stationName: station.name,
        ticketNumber: ticket?.ticketNumber || '...',
        serviceLabel: service?.label || '...',
        calledAt: ticket?.calledAt,
      };
    }).sort((a, b) => {
        const calledAtA = a.calledAt as Timestamp | undefined;
        const calledAtB = b.calledAt as Timestamp | undefined;
        if (!calledAtA) return 1;
        if (!calledAtB) return -1;
        return calledAtB.toMillis() - calledAtA.toMillis();
    });

    return data;
  }, [stations, servingTickets, settings?.services]);

  // Watch for new serving tickets and announce them
  useEffect(() => {
    if (!servingData || !isStarted) return;

    servingData.forEach(item => {
      if (!item.calledAt || item.ticketNumber === '...') return;
      const callTime = (item.calledAt as Timestamp).toMillis();
      announce(item.ticketNumber, item.stationName, callTime);
    });
  }, [servingData, isStarted, announce]);

  const shuffledMedia = useMemo(() => {
    if (!isClient || !settings?.placeholderImages || settings.placeholderImages.length === 0) {
      return [];
    }
    return shuffleArray(settings.placeholderImages);
  }, [isClient, settings?.placeholderImages]);

  const isLoading = isLoadingSettings || isLoadingStations || isLoadingAllTickets;
  
  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };

  const handleStartDisplay = () => {
    setIsStarted(true);
  };
  
  const logoUrl = settings?.companyLogoUrl?.trim();
  const isLogoValid = logoUrl && (logoUrl.startsWith('/') || logoUrl.startsWith('http'));
  const masterVolume = settings?.backgroundMusicVolume ?? 0.5;

  if (!isStarted && isClient) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white p-8">
        <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">NaviQueue Pro Display</h1>
            <p className="text-xl text-slate-300 mb-8">Click the button below to start the public queue display.</p>
            <Button 
                onClick={handleStartDisplay} 
                className="h-24 w-72 text-2xl"
                variant="outline"
            >
                <PlayCircle className="mr-4 h-10 w-10" />
                Start Display
            </Button>
            <p className="text-sm text-slate-400 mt-8">
                This one-time interaction is required by modern browsers to enable automatic audio playback for announcements.
            </p>
            <p className="text-xs text-slate-500 mt-2">
                TTS Mode: {hasBrowserTts ? '🟢 Browser (Free)' : '🟡 Cloud API'}
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-800 to-black text-white font-sans flex flex-col">
      <header className="flex-shrink-0 px-6 py-2 bg-black/30 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
              {isLogoValid && (
                  <div className="relative h-12">
                      <Image 
                          src={encodeURI(logoUrl)}
                          alt={`${settings?.companyName || 'Company'} Logo`}
                          width={300}
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
      
      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-4 min-h-0">
        <div className="min-w-0 w-full h-full bg-black/20 rounded-lg overflow-hidden flex flex-col p-4">
          <NowServing servingTickets={servingData} waitingTickets={waitingTickets} serviceMap={serviceMap} />
        </div>
        
        <div className="w-full h-full grid grid-rows-2 gap-4">
            <InfoPanel 
              mediaItems={shuffledMedia.slice(0, Math.ceil(shuffledMedia.length / 2))} 
              backgroundMusic={settings?.backgroundMusic || null}
              autoplayDelay={10000}
              isAnnouncing={isAnnouncing}
              masterVolume={masterVolume}
              loop={true}
              isStarted={isStarted}
            />
            <InfoPanel 
              mediaItems={shuffledMedia.slice(Math.ceil(shuffledMedia.length / 2))}
              backgroundMusic={null} 
              autoplayDelay={6000}
              isAnnouncing={isAnnouncing}
              masterVolume={masterVolume}
              loop={true}
              isStarted={isStarted}
            />
        </div>
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
    </div>
  );
}
