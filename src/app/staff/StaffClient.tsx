
'use client';

import { useMemo } from 'react';
import { StationControlCard } from './StationControlCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Ticket, Settings, Station } from '@/lib/types';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

export function StaffClient() {
  const { firestore } = useFirebase();
  const { profile } = useUserProfile();

  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'app') : null),
    [firestore]
  );
  const { data: settings, isLoading: isLoadingSettings } =
    useDoc<Settings>(settingsRef);

  const stationsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'stations') : null),
    [firestore]
  );
  const { data: stations, isLoading: isLoadingStations } =
    useCollection<Station>(stationsRef);

  const ticketsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'tickets') : null),
    [firestore]
  );
  const { data: tickets, isLoading: isLoadingTickets } =
    useCollection<Ticket>(ticketsRef);
    
  const sortedStations = useMemo(() => {
    if (!stations) return [];
    return [...stations].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
  }, [stations]);

  const getWaitingCount = (type: string): number => {
    if (!tickets) return 0;
    return tickets.filter((t) => t.type === type && t.status === 'waiting')
      .length;
  };

  const waitingCounts =
    settings?.services?.reduce(
      (acc, service) => {
        acc[service.id] = getWaitingCount(service.id);
        return acc;
      },
      {} as { [key: string]: number }
    ) || {};

  const isLoading =
    isLoadingSettings || isLoadingStations || isLoadingTickets;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[480px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && (!sortedStations || sortedStations.length === 0)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-lg text-center">
          <CardHeader>
            <CardTitle className="flex flex-col items-center gap-4">
              <BrainCircuit className="h-12 w-12 text-primary" />
              <span>Welcome to the Staff Dashboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="text-muted-foreground">
              There are no stations configured in the system yet.
            </p>
            {profile?.role === 'admin' && (
              <>
              <p className="mt-2 text-muted-foreground">
                Please use the admin panel to add services and stations to get
                started.
              </p>
              <Button asChild className="mt-6">
                  <Link href="/admin">Go to Admin Panel</Link>
              </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(settings?.services || []).map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <CardTitle>{service.label} Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {waitingCounts[service.id] || 0}
              </p>
              <p className="text-muted-foreground">students waiting</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
        {sortedStations?.map((station) => {
          const ticket = tickets?.find((t) => t.id === station.currentTicketId);
          return (
            <StationControlCard
              key={station.id}
              station={station}
              ticket={ticket as Ticket | undefined}
              waitingCounts={waitingCounts}
            />
          );
        })}
      </div>
    </div>
  );
}
