"use client";

import { StationControlCard } from "./StationControlCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ticket, Settings, Station } from "@/lib/types";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export function StaffClient() {
  const { firestore } = useFirebase();

  const settingsRef = useMemoFirebase(() => firestore ? collection(firestore, "settings").doc("app") : null, [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useCollection<Settings>(settingsRef);
  
  const stationsRef = useMemoFirebase(() => firestore ? collection(firestore, "stations") : null, [firestore]);
  const { data: stations, isLoading: isLoadingStations } = useCollection<Station>(stationsRef);

  const ticketsRef = useMemoFirebase(() => firestore ? collection(firestore, "tickets") : null, [firestore]);
  const { data: tickets, isLoading: isLoadingTickets } = useCollection<Ticket>(ticketsRef);

  const getWaitingCount = (type: string): number => {
    if (!tickets) return 0;
    return tickets.filter(t => t.type === type && t.status === 'waiting').length;
  };

  const waitingCounts = settings?.[0]?.services.reduce((acc, service) => {
    acc[service.id] = getWaitingCount(service.id);
    return acc;
  }, {} as { [key: string]: number }) || {};

  const isHydrated = !isLoadingSettings && !isLoadingStations && !isLoadingTickets;

  if (!isHydrated) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[480px] rounded-lg" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {settings?.[0]?.services.map(service => (
          <Card key={service.id}>
            <CardHeader>
              <CardTitle>{service.label} Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{waitingCounts[service.id] || 0}</p>
              <p className="text-muted-foreground">students waiting</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stations?.map((station) => {
          const ticket = tickets?.find(t => t.id === station.currentTicketId);
          return (
            <StationControlCard 
              key={station.id} 
              station={station}
              ticket={ticket as Ticket | undefined}
              waitingCounts={waitingCounts}
            />
          )
        })}
      </div>
    </div>
  );
}
