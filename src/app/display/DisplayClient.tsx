'use client';

import { useMemo } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { Clock } from './Clock';
import { InfoPanel } from './InfoPanel';

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

  const mostRecentTicket = useMemo(() => (servingData.length > 0 ? servingData[0] : null), [servingData]);
  const otherServingTickets = useMemo(() => (servingData.length > 0 ? servingData.slice(1) : []), [servingData]);
  
  const shuffledMedia = useMemo(() => {
    if (!settings?.placeholderImages || settings.placeholderImages.length === 0) {
      return { panel1Items: [], panel2Items: [] };
    }

    const shuffled = shuffleArray(settings.placeholderImages);
    const midpoint = Math.ceil(shuffled.length / 2);
    const panel1Items = shuffled.slice(0, midpoint);
    const panel2Items = shuffled.slice(midpoint);

    return { panel1Items, panel2Items };
  }, [settings?.placeholderImages]);

  const isLoading = isLoadingSettings || isLoadingStations || isLoadingServingTickets;

  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };
  
  const logoUrl = settings?.companyLogoUrl?.trim();
  const isLogoValid = logoUrl && (logoUrl.startsWith('/') || logoUrl.startsWith('http'));
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-sky-400 to-sky-600 text-white font-sans flex flex-col">
      <header className="flex-shrink-0 px-6 py-2 bg-black/30 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
              {isLogoValid && (
                  <div className="relative h-12">
                      <Image 
                          src={logoUrl}
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
        <div className="w-full h-full bg-black/20 rounded-lg overflow-hidden flex flex-col md:row-span-2">
            {isLoading ? (
                <Skeleton className="bg-slate-700/50 h-full w-full" />
            ) : (
                <>
                    <div className="flex-grow flex flex-col items-center justify-center p-4 text-center border-b-2 border-white/30">
                    {mostRecentTicket ? (
                        <div className="animate-pulse-slow">
                            <h2 className="text-3xl lg:text-4xl font-bold text-yellow-300">NOW SERVING</h2>
                            <p className="text-7xl lg:text-8xl font-extrabold my-2 text-white">{mostRecentTicket.ticketNumber}</p>
                            <p className="text-3xl lg:text-4xl font-bold text-white">Please proceed to</p>
                            <p className="text-5xl lg:text-6xl font-extrabold mt-1 text-yellow-300">{mostRecentTicket.stationName}</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                           <p className="text-3xl text-slate-300">No tickets being served.</p>
                        </div>
                    )}
                    </div>
                    <div className="flex-shrink-0 h-2/5 overflow-hidden">
                        <NowServing servingData={otherServingTickets} />
                    </div>
                </>
            )}
        </div>
        
        {/* Right Column */}
        <div className="flex flex-col gap-4">
            {/* Panel 1 */}
            <div className="w-full h-1/2">
                <InfoPanel mediaItems={shuffledMedia.panel1Items} backgroundMusic={settings?.backgroundMusic || null} />
            </div>

            {/* Panel 2 */}
            <div className="w-full h-1/2">
                <InfoPanel mediaItems={shuffledMedia.panel2Items} backgroundMusic={settings?.backgroundMusic || null} />
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
    </div>
  );
}
