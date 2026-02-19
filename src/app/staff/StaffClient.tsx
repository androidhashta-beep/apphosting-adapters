"use client";

import { useQueue } from "@/contexts/QueueProvider";
import { StationControlCard } from "./StationControlCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ticket, TicketType } from "@/lib/types";

export function StaffClient() {
  const { state, isHydrated } = useQueue();

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
  
  const getWaitingCount = (type: TicketType): number => {
    return state.tickets.filter(t => t.type === type && t.status === 'waiting').length;
  };

  const enrollmentWaitingCount = getWaitingCount('enrollment');
  const paymentWaitingCount = getWaitingCount('payment');
  const certificateWaitingCount = getWaitingCount('certificate');
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{enrollmentWaitingCount}</p>
            <p className="text-muted-foreground">students waiting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{paymentWaitingCount}</p>
            <p className="text-muted-foreground">students waiting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Certificate Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{certificateWaitingCount}</p>
            <p className="text-muted-foreground">students waiting</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {state.stations.map((station) => {
          const ticket = state.tickets.find(t => t.id === station.currentTicketId);
          return (
            <StationControlCard 
              key={station.id} 
              station={station}
              ticket={ticket as Ticket | undefined}
              waitingCounts={{
                enrollment: enrollmentWaitingCount,
                payment: paymentWaitingCount,
                certificate: certificateWaitingCount
              }}
            />
          )
        })}
      </div>
    </div>
  );
}
