'use client';

import { useMemo } from 'react';
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

export function DisplayClient() {
  const { firestore } = useFirebase();

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

  const ticketsQuery = useMemoFirebase(
    () => {
        if (!firestore || servingTicketIds.length === 0) return null;
        return query(collection(firestore, 'tickets'), where('__name__', 'in', servingTicketIds));
    }, [firestore, servingTicketIds]
  );

  const { data: tickets, isLoading: isLoadingTickets } = useCollection<Ticket>(ticketsQuery);

  const servingData = useMemo(() => {
    if (!stations || !tickets || !settings) return [];
    
    const servingStations = stations.filter(s => s.currentTicketId);
    
    const data = servingStations.map(station => {
      const ticket = tickets.find(t => t.id === station.currentTicketId);
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

  }, [stations, tickets, settings]);
  
  const isLoading = isLoadingSettings || isLoadingStations || isLoadingTickets;
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-sky-400 to-sky-600 text-white font-sans flex">
      {isLoading ? (
          <div className="w-full flex gap-4 p-4">
              <Skeleton className="w-2/3 h-full bg-slate-700" />
              <div className="w-1/3 h-full flex flex-col gap-4">
                <Skeleton className="h-1/2 bg-slate-700" />
                <Skeleton className="h-1/2 bg-slate-700" />
              </div>
          </div>
      ) : (
        <>
          <NowServing servingData={servingData} services={settings?.services || []} />
          <InfoPanel settings={settings} />
        </>
      )}
    </div>
  );
}
