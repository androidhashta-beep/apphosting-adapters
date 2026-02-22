
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
            <div className="bg-gold text-black p-6 rounded-lg text-center flex items-center justify-center h-full">
                <p className="text-4xl font-bold">Waiting for next customer...</p>
            </div>
        );
    }
    return (
       <div className="bg-gold text-black p-4 rounded-lg text-center h-full flex flex-col justify-center">
            <p className="text-xl uppercase tracking-widest font-semibold mb-2">Now Serving</p>
            <div className="flex justify-around items-center text-center">
                <div className="w-1/3 flex flex-col justify-center items-center h-full">
                    <p className="text-7xl lg:text-8xl font-extrabold tracking-tight break-words">{ticket.ticketNumber}</p>
                    <p className="text-2xl font-semibold mt-1">Ticket #</p>
                </div>
                <div className="w-1/3 flex flex-col justify-center items-center h-full">
                    <p className="text-5xl lg:text-6xl font-bold px-2 break-words" title={ticket.serviceLabel}>{ticket.serviceLabel}</p>
                    <p className="text-2xl font-semibold mt-1">Service</p>
                </div>
                <div className="w-1/3 flex flex-col justify-center items-center h-full">
                    <p className="text-5xl lg:text-6xl font-bold break-words">{ticket.stationName}</p>
                    <p className="text-2xl font-semibold mt-1">Window</p>
                </div>
            </div>
        </div>
    );
};

// Middle section: list of all currently served customers
const AllServingList = ({ tickets }: { tickets: ServingInfo[] }) => (
    <div className="flex flex-col bg-black/30 rounded-lg overflow-hidden animate-pulse-slow border-2 border-gold shadow-lg h-full">
        <h2 className="text-3xl font-bold text-center p-2 border-b-2 border-white/30 text-gold flex-shrink-0">
            Currently Serving
        </h2>
        <div className="flex px-4 py-2 font-bold text-xl border-b border-white/20 flex-shrink-0">
            <span className="w-1/3 text-left">Ticket #</span>
            <span className="w-1/3 text-left">Service</span>
            <span className="w-1/3 text-left">Window</span>
        </div>
        {tickets.length > 0 ? (
             <ScrollArea className="flex-grow">
                <ul className="divide-y divide-white/20">
                    {tickets.map((item) => (
                        <li key={`${item.ticketNumber}-${item.stationName}`} className="flex items-center p-4 text-3xl font-bold">
                            <span className="w-1/3 text-left break-words">{item.ticketNumber}</span>
                            <span className="w-1/3 text-left break-words">{item.serviceLabel}</span>
                            <span className="w-1/3 text-left break-words">{item.stationName}</span>
                        </li>
                    ))}
                </ul>
            </ScrollArea>
        ) : (
            <div className="flex h-full items-center justify-center text-center text-slate-300 p-4">
                <p className="text-2xl">No tickets are being served right now.</p>
            </div>
        )}
    </div>
);

// Bottom section: list of all waiting customers
const WaitingQueue = ({ waitingTickets, serviceMap }: { waitingTickets: Ticket[], serviceMap: Map<string, string> }) => (
    <div className="flex flex-col bg-black/20 rounded-lg overflow-hidden h-full">
        <h2 className="text-3xl font-bold text-center p-2 border-b-2 border-white/30 flex-shrink-0">Waiting Queue</h2>
        <div className="flex px-4 py-2 font-bold text-xl border-b border-white/20 flex-shrink-0">
            <span className="w-1/2 text-left">Ticket #</span>
            <span className="w-1/2 text-left">Service</span>
        </div>
        <ScrollArea className="flex-grow">
            {waitingTickets.length > 0 ? (
                <ul className="divide-y divide-white/20">
                    {waitingTickets.map((item, index) => (
                        <li key={item.id} className={cn("flex items-center p-4 text-3xl font-bold", index === 0 && "bg-white/10")}>
                            <span className="w-1/2 text-left break-words">{item.ticketNumber}</span>
                            <span className="w-1/2 text-left break-words">{serviceMap.get(item.type) || item.type}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex h-full items-center justify-center text-center text-slate-300">
                    <p className="text-2xl">The queue is currently empty.</p>
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
    <div className="h-full flex flex-col gap-4">
      {/* Top Section: Most Recent */}
      <div className="flex-1 min-h-0">
        <MostRecentCard ticket={mostRecentTicket} />
      </div>

      {/* Middle Section: All Serving */}
      <div className="flex-1 min-h-0">
          <AllServingList tickets={servingTickets} />
      </div>

      {/* Bottom Section: Waiting */}
      <div className="flex-1 min-h-0">
          <WaitingQueue waitingTickets={waitingTickets} serviceMap={serviceMap} />
      </div>
    </div>
  );
}
