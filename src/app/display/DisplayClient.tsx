'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdCarousel } from './AdCarousel';
import { useEffect, useState, useMemo } from 'react';
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

function NowServing({ ticket, stationName }: { ticket: Ticket; stationName: string }) {
    const [isAnimating, setIsAnimating] = useState(false);

    // Animate when the ticket ID changes
    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 1200); // Animation duration
        return () => clearTimeout(timer);
    }, [ticket.id]);

    return (
        <Card className="bg-destructive text-destructive-foreground border-4 border-destructive-foreground/50 shadow-2xl overflow-hidden">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl uppercase tracking-wider">Now Serving</CardTitle>
            </CardHeader>
            <CardContent className="text-center p-4">
                <div 
                    key={ticket.id} 
                    className={cn("transition-all duration-500 transform", isAnimating ? 'scale-110' : 'scale-100')}
                >
                    <p className="text-7xl md:text-8xl font-bold tracking-tight">{ticket.ticketNumber}</p>
                    <p className="text-3xl md:text-4xl font-semibold mt-2">{stationName}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export function DisplayClient() {
  const { firestore, isUserLoading } = useFirebase();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const router = useRouter();

  // --- Data Fetching ---
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'app') : null), [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);

  const stationsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'stations') : null), [firestore]);
  const { data: stations, isLoading: isLoadingStations } = useCollection<Station>(stationsRef);

  const servingTicketQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'tickets'), where('status', '==', 'serving'), limit(1)) : null,
    [firestore]
  );
  const { data: servingTickets, isLoading: isLoadingServing } = useCollection<Ticket>(servingTicketQuery);
  const servingTicket = useMemo(() => (servingTickets && servingTickets.length > 0 ? servingTickets[0] : null), [servingTickets]);

  const historyTicketsQuery = useMemoFirebase(
    () => firestore ? query(
        collection(firestore, 'tickets'),
        where('status', 'in', ['served', 'skipped']),
        orderBy('calledAt', 'desc'),
        limit(5)
      ) : null,
    [firestore]
  );
  const { data: historyTickets, isLoading: isLoadingHistory } = useCollection<Ticket>(historyTicketsQuery);

  const waitingTicketsQuery = useMemoFirebase(
    () => firestore ? query(
        collection(firestore, 'tickets'),
        where('status', '==', 'waiting'),
        orderBy('createdAt', 'asc'),
        limit(10)
      ) : null,
    [firestore]
  );
  const { data: waitingTickets, isLoading: isLoadingWaiting } = useCollection<Ticket>(waitingTicketsQuery);

  // --- Effects ---
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Handlers & Helpers ---
  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };

  const getStationName = (stationId?: string) => {
    if (!stationId || !stations) return '-';
    return stations.find((s) => s.id === stationId)?.name || '-';
  };

  const getServiceLabel = (serviceId: string) => {
    if (!settings?.services) return 'SERVICE';
    const service = settings.services.find((s) => s.id === serviceId);
    return service ? service.label.toUpperCase() : 'SERVICE';
  };

  // --- Render Logic ---
  const isHydrated = !isLoadingSettings && !isLoadingStations && !isLoadingServing && !isLoadingHistory && !isLoadingWaiting && !isUserLoading;
  const stationNameForServing = getStationName(servingTicket?.servedBy);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-1 flex flex-col gap-4 h-full">
        {/* Now Serving Card */}
        {isHydrated && servingTicket ? (
            <NowServing ticket={servingTicket} stationName={stationNameForServing} />
        ) : (
            <Card className="flex items-center justify-center bg-muted/50 h-56">
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground text-lg">The queue is quiet.</p>
                    <p className="text-muted-foreground text-sm">No customer is currently being served.</p>
                </CardContent>
            </Card>
        )}
       
        {/* History and Waiting List Card */}
        <Card className="flex flex-col flex-grow min-h-0">
          <CardHeader className="p-4 border-b">
            <div className="grid grid-cols-3 text-center font-bold text-muted-foreground uppercase">
              <div>Queue No.</div>
              <div>Service</div>
              <div>Counter</div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow overflow-y-auto">
            <div className="flex flex-col gap-3">
              {!isHydrated && [...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}

              {isHydrated && (historyTickets ?? []).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="grid grid-cols-3 items-center text-center p-2 rounded-lg text-lg font-semibold bg-muted/30 border"
                  >
                    <div className={cn(ticket.status === 'skipped' && 'line-through text-muted-foreground/80')}>{ticket.ticketNumber}</div>
                    <div className={cn("text-base", ticket.status === 'skipped' && 'line-through text-muted-foreground/80')}>{getServiceLabel(ticket.type)}</div>
                    <div className={cn(ticket.status === 'skipped' && 'line-through text-muted-foreground/80')}>{getStationName(ticket.servedBy)}</div>
                  </div>
              ))}

              {isHydrated && (waitingTickets ?? []).length > 0 && (
                <>
                  {(historyTickets?.length ?? 0) > 0 && <Separator className="my-2" />}
                  <h3 className="text-center text-sm text-muted-foreground font-semibold uppercase tracking-wider pb-1">
                    Waiting
                  </h3>
                  {(waitingTickets ?? []).map((ticket) => (
                    <div key={ticket.id} className="grid grid-cols-3 items-center text-center p-2 rounded-lg text-lg font-semibold bg-card border-dashed">
                      <div>{ticket.ticketNumber}</div>
                      <div className="text-base">{getServiceLabel(ticket.type)}</div>
                      <div>-</div>
                    </div>
                  ))}
                </>
              )}

              {isHydrated && !servingTicket && (historyTickets?.length ?? 0) === 0 && (waitingTickets?.length ?? 0) === 0 && (
                  <div className="flex items-center justify-center h-full py-10">
                    <p className="text-muted-foreground">The queue is currently empty.</p>
                  </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Carousel and Footer */}
      <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
        <div className="flex-grow min-h-0">
          <AdCarousel 
            adItems={settings?.placeholderImages || []} 
            backgroundMusic={settings?.backgroundMusic || []}
          />
        </div>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <p className="font-semibold text-muted-foreground text-sm md:text-base">
              {currentTime?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex items-center gap-2 md:gap-4">
              <p className="text-lg md:text-2xl font-bold font-mono text-foreground">
                {currentTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
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
