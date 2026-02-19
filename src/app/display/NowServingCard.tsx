
"use client";

import { useQueue } from "@/contexts/QueueProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Station } from "@/lib/types";
import { useEffect, useState } from "react";

export function NowServingCard({ station }: { station: Station }) {
  const { state } = useQueue();
  const currentStationState = state.stations.find(s => s.id === station.id);
  const ticket = state.tickets.find(t => t.id === currentStationState?.currentTicketId);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (ticket) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [ticket?.id]);

  const isClosed = station.status === 'closed';

  return (
    <Card
      className={cn(
        "text-center transition-all duration-300",
        isClosed ? "bg-muted/60 border-dashed" : "border-primary/50 shadow-lg",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-xl", isClosed && "text-muted-foreground")}>
          {station.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-primary/10 rounded-lg p-4 h-24 flex items-center justify-center">
          <p
            key={ticket?.id || 'none'}
            className={cn(
              "text-4xl font-bold",
              isClosed ? "text-muted-foreground" : "text-primary",
              isAnimating && "animate-in fade-in-0 zoom-in-50"
            )}
          >
            {isClosed ? 'CLOSED' : ticket ? ticket.ticketNumber : '-'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
