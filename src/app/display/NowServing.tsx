'use client';

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Ticket } from '@/lib/types';

// The data for a single row in the "now serving" list
type ServingInfo = {
    stationName: string;
    ticketNumber: string;
    serviceLabel: string;
};

// Top card for the single most recent ticket
const MostRecentCard = ({ ticket }: { ticket: ServingInfo | null }) => {
    if (!ticket) {
        return (
            <div className="bg-gold text-black p-4 rounded-lg text-center flex items-center justify-center h-full">
                <p className="text-3xl font-bold">Waiting for next customer...</p>
            </div>
        );
    }
    return (
       <div className="bg-gold text-black p-4 rounded-lg text-center h-full flex flex-col justify-center">
            <p className="text-2xl uppercase tracking-widest font-semibold mb-2 flex-shrink-0">Now Serving</p>
            <div className="grid grid-cols-3 items-center text-center flex-grow min-w-0">
                <div className="flex flex-col justify-center items-center h-full px-2 min-w-0">
                    <p className="text-8xl font-extrabold tracking-tight break-words">{ticket.ticketNumber}</p>
                    <p className="text-2xl font-semibold mt-1">Ticket #</p>
                </div>
                <div className="flex flex-col justify-center items-center h-full px-2 min-w-0">
                    <p className="text-5xl font-bold break-words" title={ticket.serviceLabel}>{ticket.serviceLabel}</p>
                    <p className="text-2xl font-semibold mt-1">Service</p>
                </div>
                <div className="flex flex-col justify-center items-center h-full px-2 min-w-0">
                    <p className="text-5xl font-bold break-words">{ticket.stationName}</p>
                    <p className="text-2xl font-semibold mt-1">Window</p>
                </div>
            </div>
        </div>
    );
};

// Middle section: list of all currently served customers
const AllServingList = ({ tickets }: { tickets: ServingInfo[] }) => (
    <div className="flex flex-col bg-black/30 rounded-lg overflow-hidden animate-pulse-slow border-2 border-gold shadow-lg h-full">
        <h2 className="text-2xl font-bold text-center p-2 border-b-2 border-white/30 text-gold flex-shrink-0">
            Currently Serving
        </h2>
        <div className="grid grid-cols-3 px-4 py-2 font-bold text-lg border-b border-white/20 flex-shrink-0">
            <span className="text-left">Ticket #</span>
            <span className="text-left">Service</span>
            <span className="text-left">Window</span>
        </div>
        {tickets.length > 0 ? (
             <ScrollArea className="flex-grow">
                <ul className="divide-y divide-white/20">
                    {tickets.map((item) => (
                        <li key={`${item.ticketNumber}-${item.stationName}`} className="grid grid-cols-3 items-center p-4 font-bold text-4xl">
                            <span className="text-left break-words">{item.ticketNumber}</span>
                            <span className="text-left break-words">{item.serviceLabel}</span>
                            <span className="text-left break-words">{item.stationName}</span>
                        </li>
                    ))}
                </ul>
            </ScrollArea>
        ) : (
            <div className="flex h-full items-center justify-center text-center text-slate-300 p-4">
                <p className="text-xl">No tickets are being served right now.</p>
            </div>
        )}
    </div>
);

// Bottom section: list of all waiting customers
const WaitingQueue = ({ waitingTickets, serviceMap }: { waitingTickets: Ticket[], serviceMap: Map<string, string> }) => (
    <div className="flex flex-col bg-black/20 rounded-lg overflow-hidden h-full">
        <h2 className="text-2xl font-bold text-center p-2 border-b-2 border-white/30 flex-shrink-0">Waiting Queue</h2>
        <div className="grid grid-cols-2 px-4 py-2 font-bold text-lg border-b border-white/20 flex-shrink-0">
            <span className="text-left">Ticket #</span>
            <span className="text-left">Service</span>
        </div>
        <ScrollArea className="flex-grow">
            {waitingTickets.length > 0 ? (
                <ul className="divide-y divide-white/20">
                    {waitingTickets.map((item, index) => (
                        <li key={item.id} className={cn("grid grid-cols-2 items-center p-4 font-bold text-4xl", index === 0 && "bg-white/10")}>
                            <span className="text-left break-words">{item.ticketNumber}</span>
                            <span className="text-left break-words">{serviceMap.get(item.type) || item.type}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex h-full items-center justify-center text-center text-slate-300">
                    <p className="text-xl">The queue is currently empty.</p>
                </div>
            )}
        </ScrollArea>
    </div>
);

export function NowServing({
  servingTickets,
  waitingTickets,
  serviceMap,
}: {
  servingTickets: ServingInfo[];
  waitingTickets: Ticket[];
  serviceMap: Map<string, string>;
}) {
  const mostRecentTicket = servingTickets.length > 0 ? servingTickets[0] : null;

  return (
    <div className="h-full grid grid-rows-3 gap-4">
      {/* Top Section: Most Recent */}
      <div className="min-h-0">
        <MostRecentCard ticket={mostRecentTicket} />
      </div>

      {/* Middle Section: All Serving */}
      <div className="min-h-0">
          <AllServingList tickets={servingTickets} />
      </div>

      {/* Bottom Section: Waiting */}
      <div className="min-h-0">
          <WaitingQueue waitingTickets={waitingTickets} serviceMap={serviceMap} />
      </div>
    </div>
  );
}
