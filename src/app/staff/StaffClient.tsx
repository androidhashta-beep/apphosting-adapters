"use client";

import { useQueue } from "@/contexts/QueueProvider";
import { StationControlCard } from "./StationControlCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ticket, TicketType } from "@/lib/types";

export function StaffClient() {
  const { state, isHydrated } = useQueue();

  const getWaitingCount = (type: TicketType): number => {
    return state.tickets.filter(t => t.type === type && t.status === 'waiting').length;
  };

  const waitingCounts = state.settings.services.reduce((acc, service) => {
    acc[service.id] = getWaitingCount(service.id);
    return acc;
  }, {} as { [key: string]: number });

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
        {state.settings.services.map(service => (
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
        {state.stations.map((station) => {
          const ticket = state.tickets.find(t => t.id === station.currentTicketId);
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
