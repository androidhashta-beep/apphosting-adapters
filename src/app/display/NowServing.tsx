
"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Ticket } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";

type NowServingCardProps = {
  ticketNumber: string;
  stationName: string;
  isMostRecent: boolean;
};

const NowServingCard = ({ ticketNumber, stationName, isMostRecent }: NowServingCardProps) => (
  <div className={cn(
    "flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-300",
    isMostRecent ? "bg-yellow-400 text-black animate-pulse-slow" : "bg-white/10 text-white"
  )}>
    <p className="text-5xl lg:text-7xl font-extrabold">{ticketNumber}</p>
    <p className="text-xl lg:text-2xl font-bold">{stationName}</p>
  </div>
);

type WaitingQueueProps = {
  waitingTickets: Ticket[];
  serviceMap: Map<string, string>;
};

const WaitingQueue = ({ waitingTickets, serviceMap }: WaitingQueueProps) => (
  <div className="flex flex-col bg-black/20 rounded-lg overflow-hidden h-full">
    <h2 className="text-xl font-bold text-center p-2 border-b-2 border-white/30">Waiting</h2>
    <ScrollArea className="flex-grow">
      {waitingTickets.length > 0 ? (
        <ul className="flex flex-col">
          {waitingTickets.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex items-center justify-between px-4 py-2 text-3xl font-extrabold border-b border-white/20",
              )}
            >
              <span className="text-left justify-self-start text-2xl">{serviceMap.get(item.type) || item.type}</span>
              <span className="text-center">{item.ticketNumber}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex h-full items-center justify-center text-center text-slate-300">
          <p className="text-lg">The queue is currently empty.</p>
        </div>
      )}
    </ScrollArea>
  </div>
);

type NowServingProps = {
  servingTickets: { stationName: string; ticketNumber: string }[];
  waitingTickets: Ticket[];
  serviceMap: Map<string, string>;
};

export function NowServing({ servingTickets, waitingTickets, serviceMap }: NowServingProps) {
  const hasServingTickets = servingTickets && servingTickets.length > 0;
  
  return (
    <div className="h-full flex flex-col">
      {/* Main Header */}
      <div className="px-4 py-3 border-b-4 border-yellow-400 flex-shrink-0">
        <h2 className="text-4xl font-extrabold text-center uppercase tracking-wider">Now Serving</h2>
      </div>

      {/* Content Area */}
      <div className="flex-grow grid grid-cols-1 md:grid-rows-2 gap-4 p-4">
        {/* Top Part: Serving Tickets */}
        <div className="grid grid-cols-2 gap-4">
          {hasServingTickets ? (
            servingTickets.slice(0, 4).map((ticket, index) => (
              <NowServingCard 
                key={ticket.stationName || index} 
                ticketNumber={ticket.ticketNumber} 
                stationName={ticket.stationName}
                isMostRecent={index === 0}
              />
            ))
          ) : (
            <div className="col-span-2 flex items-center justify-center bg-white/10 rounded-lg text-slate-300 text-lg">
              No tickets are currently being served.
            </div>
          )}
           {/* Fill remaining grid cells if less than 4 tickets */}
           {Array.from({ length: Math.max(0, 4 - servingTickets.length) }).map((_, index) => (
              <div key={`placeholder-${index}`} className="bg-white/10 rounded-lg" />
            ))}
        </div>

        {/* Bottom Part: Waiting Queue */}
        <div className="h-full overflow-hidden">
          <WaitingQueue waitingTickets={waitingTickets} serviceMap={serviceMap} />
        </div>
      </div>
    </div>
  );
}
