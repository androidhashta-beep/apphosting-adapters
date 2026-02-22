
'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Ticket, Settings, Station, Service } from '@/lib/types';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import { collection, doc, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { NowServing } from './NowServing';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { Clock } from './Clock';
import { InfoPanel } from './InfoPanel';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const waitingTicketsQuery = useMemoFirebase(
      () => {
          if (!firestore) return null;
          return query(collection(firestore, 'tickets'), where('status', '==', 'waiting'), orderBy('createdAt', 'asc'));
      }, [firestore]
    );
  const { data: waitingTickets, isLoading: isLoadingWaitingTickets } = useCollection<Ticket>(waitingTicketsQuery);

  const serviceMap = useMemo(() => {
    if (!settings?.services) return new Map<string, string>();
    return new Map(settings.services.map(s => [s.id, s.label]));
  }, [settings?.services]);

  const servingData = useMemo(() => {
    if (!stations || !servingTickets || !settings) return [];
    
    const servingStations = stations.filter(s => s.currentTicketId);
    
    const data = servingStations.map(station => {
      const ticket = servingTickets.find(t => t.id === station.currentTicketId);
      const service = settings?.services?.find(s => s.id === ticket?.type);
      return {
        stationName: station.name,
        ticketNumber: ticket?.ticketNumber || '...',
        serviceLabel: service?.label || '...',
        calledAt: ticket?.calledAt,
      };
    }).sort((a, b) => {
        if (!a.calledAt) return 1;
        if (!b.calledAt) return -1;
        return (b.calledAt as Timestamp).toMillis() - (a.calledAt as Timestamp).toMillis();
    });

    return data;

  }, [stations, servingTickets, settings]);

  const mostRecentTicket = useMemo(() => (servingData.length > 0 ? servingData[0] : null), [servingData]);
  
  const [announcementAudio, setAnnouncementAudio] = useState<string | null>(null);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const announcementAudioRef = useRef<HTMLAudioElement>(null);
  const lastAnnouncedTicketRef = useRef<{ id: string, time: number } | null>(null);

  useEffect(() => {
    if (!mostRecentTicket || !settings?.services || !mostRecentTicket.calledAt) {
      return;
    }

    const ticketId = mostRecentTicket.ticketNumber;
    const callTime = (mostRecentTicket.calledAt as Timestamp).toMillis();

    if (lastAnnouncedTicketRef.current?.id !== ticketId || lastAnnouncedTicketRef.current?.time !== callTime) {
      lastAnnouncedTicketRef.current = { id: ticketId, time: callTime };

      const textToAnnounce = `Ticket number ${mostRecentTicket.ticketNumber}, please proceed to ${mostRecentTicket.stationName}.`;

      textToSpeech(textToAnnounce).then(result => {
        if (result.media) {
          setAnnouncementAudio(result.media);
        } else if (result.error) {
          console.error("TTS Error:", result.error);
          toast({ variant: 'destructive', title: 'TTS Error', description: result.error });
        }
      }).catch(error => {
        console.error("TTS Flow Error:", error);
        toast({ variant: 'destructive', title: 'TTS Flow Error', description: 'Could not generate announcement audio.' });
      });
    }
  }, [mostRecentTicket, settings?.services, toast]);

  useEffect(() => {
    const audio = announcementAudioRef.current;
    if (audio && announcementAudio) {
      audio.play().catch(e => console.warn("Announcement audio playback failed", e));
    }
  }, [announcementAudio]);


  const { topPanelMedia, bottomPanelMedia } = useMemo(() => {
    if (!isClient || !settings?.placeholderImages || settings.placeholderImages.length === 0) {
      return { topPanelMedia: [], bottomPanelMedia: [] };
    }

    const shuffled = shuffleArray(settings.placeholderImages);
    const midpoint = Math.ceil(shuffled.length / 2);
    const top = shuffled.slice(0, midpoint);
    const bottom = shuffled.slice(midpoint);

    return { topPanelMedia: top, bottomPanelMedia: bottom };
  }, [isClient, settings?.placeholderImages]);

  const isLoading = isLoadingSettings || isLoadingStations || isLoadingServingTickets || isLoadingWaitingTickets;
  
  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };
  
  const logoUrl = settings?.companyLogoUrl?.trim();
  const isLogoValid = logoUrl && (logoUrl.startsWith('/') || logoUrl.startsWith('http'));
  const masterVolume = settings?.backgroundMusicVolume ?? 0.5;

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-sky-400 to-sky-600 text-white font-sans flex flex-col">
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
      
      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Left Column: Ticket Info */}
        <div className="w-full h-full bg-black/20 rounded-lg overflow-hidden flex flex-col">
          <NowServing servingTickets={servingData} waitingTickets={waitingTickets || []} serviceMap={serviceMap} />
        </div>
        
        {/* Right Column */}
        <div className="grid grid-rows-2 gap-4">
            {/* Top Right Panel */}
            <div className="w-full h-full">
                <InfoPanel 
                  mediaItems={topPanelMedia} 
                  backgroundMusic={settings?.backgroundMusic || null}
                  autoplayDelay={10000}
                  isAnnouncing={isAnnouncing}
                  masterVolume={masterVolume}
                />
            </div>

            {/* Bottom Right Panel */}
            <div className="w-full h-full">
                <InfoPanel 
                  mediaItems={bottomPanelMedia} 
                  backgroundMusic={null}
                  autoplayDelay={5000}
                  isAnnouncing={isAnnouncing}
                  masterVolume={masterVolume}
                />
            </div>
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
      <audio 
          ref={announcementAudioRef} 
          src={announcementAudio || undefined}
          onPlay={() => setIsAnnouncing(true)}
          onEnded={() => setIsAnnouncing(false)}
          onError={() => setIsAnnouncing(false)}
          hidden
      />
    </div>
  );
}
