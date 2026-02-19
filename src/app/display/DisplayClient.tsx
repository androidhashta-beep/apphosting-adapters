
"use client";

import { useQueue } from "@/contexts/QueueProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdCarousel } from "./AdCarousel";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function DisplayClient() {
  const { state, isHydrated } = useQueue();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client mount to avoid hydration mismatch
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const recentlyCalledTickets = state.tickets
    .filter(t => t.status === 'serving' || t.status === 'served' || t.status === 'skipped')
    .sort((a, b) => (b.calledAt ?? 0) - (a.calledAt ?? 0))
    .slice(0, 10);

  const getStationName = (stationId: string | undefined) => {
    if (!stationId) return '-';
    return state.stations.find(s => s.id === stationId)?.name || '-';
  }
  
  const getServiceLabel = (type: string) => {
      switch(type) {
          case 'enrollment': return 'ENROLLMENT';
          case 'payment': return 'PAYMENT';
          case 'certificate': return 'CERTIFICATE';
          default: return 'SERVICE';
      }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Section: Queue List */}
      <div className="lg:col-span-1 h-full">
        <Card className="flex flex-col h-full">
          <CardHeader className="p-4 border-b">
            <div className="grid grid-cols-3 text-center font-bold text-muted-foreground uppercase">
              <div>Queue No.</div>
              <div>Services</div>
              <div>Counter</div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow overflow-y-auto">
            <div className="flex flex-col gap-3">
              {!isHydrated && [...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              {isHydrated && recentlyCalledTickets.map((ticket, index) => (
                <div 
                  key={ticket.id} 
                  className={cn(
                    "grid grid-cols-3 items-center text-center p-3 rounded-lg text-2xl font-bold transition-all",
                    index === 0 && ticket.status !== 'skipped'
                        ? "bg-destructive text-destructive-foreground animate-pulse" 
                        : "bg-card border",
                    ticket.status === 'skipped' && "bg-muted text-muted-foreground opacity-60 line-through"
                  )}
                >
                  <div>{ticket.ticketNumber}</div>
                  <div className="text-xl">{getServiceLabel(ticket.type)}</div>
                  <div>{getStationName(ticket.servedBy)}</div>
                </div>
              ))}
              {isHydrated && recentlyCalledTickets.length === 0 && (
                 <div className="flex items-center justify-center h-full py-10">
                    <p className="text-muted-foreground">Waiting for next ticket...</p>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Section: Ads and Info */}
      <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
        <div className="flex-grow min-h-0">
            <AdCarousel />
        </div>
        <Card>
            <CardContent className="p-4 flex justify-between items-center">
                <p className="font-semibold text-muted-foreground">{currentTime?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-2xl font-bold font-mono text-foreground">
                    {currentTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
