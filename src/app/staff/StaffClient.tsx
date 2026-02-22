
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
import { collection, doc, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const waitingTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets
      .filter((t) => t.status === 'waiting')
      .sort((a, b) => (a.createdAt as Timestamp).toMillis() - (b.createdAt as Timestamp).toMillis());
  }, [tickets]);

  const waitingCounts = useMemo(() => {
    if (!waitingTickets || !settings?.services) return {};
    return settings.services.reduce(
      (acc, service) => {
        acc[service.id] = waitingTickets.filter(t => t.type === service.id).length;
        return acc;
      },
      {} as { [key: string]: number }
    );
  }, [waitingTickets, settings?.services]);

  const serviceMap = useMemo(() => {
    if (!settings?.services) return new Map();
    return new Map(settings.services.map(s => [s.id, s.label]));
  }, [settings?.services]);
  
  const servicesForTabs = useMemo(() => settings?.services?.slice(0, 3) || [], [settings?.services]);

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
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-40 w-full" />
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

  const hasServices = settings?.services && settings.services.length > 0;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Waiting Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {hasServices ? (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${servicesForTabs.length + 1}, 1fr)`}}>
                <TabsTrigger value="all">All ({waitingTickets.length})</TabsTrigger>
                {servicesForTabs.map((service) => (
                  <TabsTrigger key={service.id} value={service.id}>
                    {service.label} ({waitingCounts[service.id] || 0})
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="all">
                <ScrollArea className="h-72">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                        <TableHead className="w-[120px]">Ticket #</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead className="text-right">Waiting Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitingTickets.length > 0 ? (
                        waitingTickets.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                            <TableCell>{serviceMap.get(ticket.type) || ticket.type}</TableCell>
                            <TableCell className="text-right">
                              {formatDistanceToNow(ticket.createdAt.toDate(), { addSuffix: true })}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            The queue is empty.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              {servicesForTabs.map((service) => (
                <TabsContent key={service.id} value={service.id}>
                   <ScrollArea className="h-72">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card">
                        <TableRow>
                          <TableHead className="w-[120px]">Ticket #</TableHead>
                          <TableHead className="text-right">Waiting Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {waitingTickets.filter(t => t.type === service.id).length > 0 ? (
                          waitingTickets
                            .filter(t => t.type === service.id)
                            .map((ticket) => (
                              <TableRow key={ticket.id}>
                                <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                                <TableCell className="text-right">
                                  {formatDistanceToNow(ticket.createdAt.toDate(), { addSuffix: true })}
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                              No one is waiting for {service.label}.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <p className="text-center text-muted-foreground p-4">
              No services configured. Please go to the admin panel to add services.
            </p>
          )}
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
              waitingCounts={waitingCounts}
            />
          );
        })}
      </div>
    </div>
  );
}
