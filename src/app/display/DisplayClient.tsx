'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AdCarousel } from './AdCarousel';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import {
  useCollection,
  useFirebase,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import type { Ticket, Station, Settings } from '@/lib/types';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  doc,
} from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';

export function DisplayClient() {
  const { firestore, isUserLoading } = useFirebase();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const router = useRouter();

  const settingsRef = useMemoFirebase(
    () => (firestore && !isUserLoading ? doc(firestore, 'settings', 'app') : null),
    [firestore, isUserLoading]
  );
  const { data: settings, isLoading: isLoadingSettings } =
    useDoc<Settings>(settingsRef);

  const stationsRef = useMemoFirebase(
    () => (firestore && !isUserLoading ? collection(firestore, 'stations') : null),
    [firestore, isUserLoading]
  );
  const { data: stations, isLoading: isLoadingStations } =
    useCollection<Station>(stationsRef);

  const servingTicketsQuery = useMemoFirebase(
    () =>
      firestore && !isUserLoading
        ? query(
            collection(firestore, 'tickets'),
            where('status', 'in', ['serving', 'served', 'skipped']),
            orderBy('calledAt', 'desc'),
            limit(5)
          )
        : null,
    [firestore, isUserLoading]
  );
  const { data: recentlyCalledTickets, isLoading: isLoadingTickets } =
    useCollection<Ticket>(servingTicketsQuery);

  const waitingTicketsQuery = useMemoFirebase(
    () =>
      firestore && !isUserLoading
        ? query(
            collection(firestore, 'tickets'),
            where('status', '==', 'waiting'),
            orderBy('createdAt', 'asc'),
            limit(10)
          )
        : null,
    [firestore, isUserLoading]
  );
  const { data: waitingTickets, isLoading: isLoadingWaitingTickets } =
    useCollection<Ticket>(waitingTicketsQuery);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };

  const getStationName = (stationId: string | undefined) => {
    if (!stationId) return '-';
    return stations?.find((s) => s.id === stationId)?.name || '-';
  };

  const getServiceLabel = (serviceId: string) => {
    if (!settings?.services) return 'SERVICE';
    const service = settings.services.find((s) => s.id === serviceId);
    return service ? service.label.toUpperCase() : 'SERVICE';
  };

  const isHydrated =
    !isLoadingSettings &&
    !isLoadingStations &&
    !isLoadingTickets &&
    !isLoadingWaitingTickets &&
    !isUserLoading;

  const adItems = settings?.placeholderImages || [];
  const backgroundMusic = settings?.backgroundMusic || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-1 h-full">
        <Card className="flex flex-col h-full">
          <CardHeader className="p-4 border-b border-gold">
            <div className="grid grid-cols-3 text-center font-bold text-muted-foreground uppercase">
              <div>Queue No.</div>
              <div>Services</div>
              <div>Counter</div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow overflow-y-auto">
            <div className="flex flex-col gap-3">
              {!isHydrated &&
                [...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}

              {isHydrated &&
                recentlyCalledTickets?.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={cn(
                      'grid grid-cols-3 items-center text-center p-3 rounded-lg text-2xl font-bold transition-all',
                      {
                        'bg-destructive text-destructive-foreground animate-pulse':
                          ticket.status === 'serving',
                        'bg-card border border-gold': ticket.status === 'served',
                        'bg-muted text-muted-foreground opacity-60 line-through':
                          ticket.status === 'skipped',
                      }
                    )}
                  >
                    <div>{ticket.ticketNumber}</div>
                    <div className="text-xl">{getServiceLabel(ticket.type)}</div>
                    <div>{getStationName(ticket.servedBy)}</div>
                  </div>
                ))}

              {isHydrated && waitingTickets && waitingTickets.length > 0 && (
                <>
                  {(recentlyCalledTickets?.length ?? 0) > 0 && (
                    <Separator className="my-2" />
                  )}
                  <h3 className="text-center text-sm text-muted-foreground font-semibold uppercase tracking-wider pb-1">
                    Waiting
                  </h3>
                  {waitingTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="grid grid-cols-3 items-center text-center p-2 rounded-lg text-xl font-semibold bg-muted/30 border"
                    >
                      <div>{ticket.ticketNumber}</div>
                      <div className="text-lg">
                        {getServiceLabel(ticket.type)}
                      </div>
                      <div>-</div>
                    </div>
                  ))}
                </>
              )}

              {isHydrated &&
                (recentlyCalledTickets?.length === 0 &&
                  waitingTickets?.length === 0) && (
                  <div className="flex items-center justify-center h-full py-10">
                    <p className="text-muted-foreground">
                      The queue is currently empty.
                    </p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
        <div className="flex-grow min-h-0">
          <AdCarousel adItems={adItems} backgroundMusic={backgroundMusic} />
        </div>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <p className="font-semibold text-muted-foreground">
              {currentTime?.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <div className="flex items-center gap-4">
              <p className="text-2xl font-bold font-mono text-foreground">
                {currentTime?.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </p>
              <ThemeSwitcher />
              <Button variant="outline" size="icon" onClick={handleGoHome}>
                <Home className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Home</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
