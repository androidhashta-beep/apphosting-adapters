
'use client';

import { useMemo } from 'react';
import { StationControlCard } from './StationControlCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { Ticket, Settings, Station } from '@/lib/types';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
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

  const isLoading =
    isLoadingSettings || isLoadingStations || isLoadingTickets;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-32" />)}
            </div>
          </CardContent>
        </Card>
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
      <Card>
        <CardHeader>
          <CardTitle>Queue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {isLoadingSettings ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-32" />)
            ) : settings?.services?.length ? (
              settings.services.map((service) => (
                <div key={service.id} className="flex items-center gap-2 rounded-lg border bg-card p-3 shadow-sm">
                  <span className="font-semibold">{service.label}</span>
                  <Badge variant="secondary">{waitingCounts[service.id] || 0}</Badge>
                </div>
              ))
            ) : (
               <p className="text-center text-muted-foreground p-4">
                No services configured. Please go to the admin panel to add services.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
        {sortedStations?.map((station) => {
          const ticket = tickets?.find((t) => t.id === station.currentTicketId);
          return (
            <StationControlCard
              key={station.id}
              station={station}
              ticket={ticket as Ticket | undefined}
              allTickets={tickets || []}
              waitingCounts={waitingCounts}
            />
          );
        })}
      </div>
    </div>
  );
}
