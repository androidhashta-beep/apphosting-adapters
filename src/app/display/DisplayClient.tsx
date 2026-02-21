
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
      
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div className="md:col-span-2 w-full h-full">
        {isLoading ? (
            <div className="w-full h-full">
                <Skeleton className="bg-slate-700/50 h-full w-full rounded-lg" />
            </div>
        ) : (
          <div className="w-full h-full bg-black/20 rounded-lg overflow-hidden flex flex-col">
            <NowServing servingData={servingData} />
          </div>
        )}
        </div>
        <div className="w-full h-full">
            <InfoPanel settings={settings} contentType="all" />
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
