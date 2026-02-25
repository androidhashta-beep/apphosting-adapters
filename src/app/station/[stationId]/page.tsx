'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { doc, collection } from 'firebase/firestore';

import { PageWrapper } from '@/components/PageWrapper';
import { AuthGuard } from '@/components/AuthGuard';
import { StationControlCard } from '@/app/staff/StationControlCard';
import { useFirebase, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Station, Ticket, Settings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function DedicatedStationPage() {
  const params = useParams();
  const stationId = params.stationId as string;
  const { firestore } = useFirebase();

  // Fetch the specific station
  const stationRef = useMemoFirebase(
    () => (firestore && stationId ? doc(firestore, 'stations', stationId) : null),
    [firestore, stationId]
  );
  const { data: station, isLoading: isLoadingStation, error: stationError } = useDoc<Station>(stationRef);

  // StationControlCard requires all tickets, settings, and waiting counts.
  const ticketsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'tickets') : null),
    [firestore]
  );
  const { data: tickets, isLoading: isLoadingTickets } = useCollection<Ticket>(ticketsRef);
  
  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'app') : null),
    [firestore]
  );
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);

  const waitingCounts = useMemo(() => {
    if (!tickets || !settings?.services) return {};
    return settings.services.reduce(
      (acc, service) => {
        acc[service.id] = tickets.filter(
          (t) => t.status === 'waiting' && t.type === service.id
        ).length;
        return acc;
      },
      {} as { [key: string]: number }
    );
  }, [tickets, settings?.services]);

  const isLoading = isLoadingStation || isLoadingTickets || isLoadingSettings;
  const ticket = useMemo(() => tickets?.find((t) => t.id === station?.currentTicketId), [tickets, station]);

  return (
    <PageWrapper title={station ? `Station: ${station.name}` : 'Station Control'} showBackButton={true}>
      <AuthGuard>
        <div className="flex justify-center">
            <div className="w-full max-w-sm">
                {isLoading && (
                    <Skeleton className="h-[480px] w-full rounded-lg" />
                )}
                
                {!isLoading && station && (
                     <StationControlCard
                        key={station.id}
                        station={station}
                        ticket={ticket as Ticket | undefined}
                        allTickets={tickets || []}
                        waitingCounts={waitingCounts}
                    />
                )}

                {!isLoading && (!station || stationError) && (
                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle className="flex flex-col items-center gap-4">
                                <AlertTriangle className="h-12 w-12 text-destructive" />
                                <span>Station Not Found</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                The station with ID "{stationId}" could not be found. Please check the URL or contact an administrator.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
      </AuthGuard>
    </PageWrapper>
  );
}
