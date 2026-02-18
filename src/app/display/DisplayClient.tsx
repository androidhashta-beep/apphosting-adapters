"use client";

import { useQueue } from "@/contexts/QueueProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdCarousel } from "./AdCarousel";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function DisplayClient() {
  const { state } = useQueue();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client mount to avoid hydration mismatch
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const recentlyCalledTickets = state.tickets
    .filter(t => t.status === 'serving' || t.status === 'served')
    .sort((a, b) => (b.calledAt ?? 0) - (a.calledAt ?? 0))
    .slice(0, 10);

  const getStationName = (stationId: string | undefined) => {
    if (!stationId) return '-';
    return state.stations.find(s => s.id === stationId)?.name || '-';
  }
  
  const getServiceLabel = (type: string) => {
      switch(type) {
          case 'counter': return 'COUNTER';
          case 'cashier': return 'PAYMENT';
          case 'certificate': return 'CERTIFICATE';
          default: return 'SERVICE';
      }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Column: Queue List */}
      <div className="lg:col-span-1">
        <Card className="h-full flex flex-col">
          <CardHeader className="p-4 border-b">
            <div className="grid grid-cols-3 text-center font-bold text-muted-foreground uppercase">
              <div>Services</div>
              <div>Queue No.</div>
              <div>Counter</div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow overflow-y-auto">
            <div className="flex flex-col gap-3">
              {recentlyCalledTickets.map((ticket, index) => (
                <div 
                  key={ticket.id} 
                  className={cn(
                    "grid grid-cols-3 items-center text-center p-3 rounded-lg text-2xl font-bold",
                    index === 0 ? "bg-primary text-primary-foreground animate-pulse" : "bg-card border"
                  )}
                >
                  <div className="text-xl">{getServiceLabel(ticket.type)}</div>
                  <div>{ticket.ticketNumber}</div>
                  <div>{getStationName(ticket.servedBy)}</div>
                </div>
              ))}
              {recentlyCalledTickets.length === 0 && (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Waiting for next ticket...</p>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Ads and Info */}
      <div className="lg:col-span-2 flex flex-col gap-6">
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
