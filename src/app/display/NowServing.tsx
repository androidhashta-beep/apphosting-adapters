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
            <div className="bg-yellow-400 text-black p-6 rounded-lg text-center flex items-center justify-center h-[212px]">
                <p className="text-2xl font-bold">Waiting for next customer...</p>
            </div>
        );
    }
    return (
       <div className="bg-yellow-400 text-black p-6 rounded-lg text-center">
            <p className="text-sm uppercase tracking-widest font-semibold mb-2">Now Serving</p>
            <div className="grid grid-cols-3 items-center justify-items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-7xl font-extrabold tracking-tight">{ticket.ticketNumber}</span>
                    <span className="text-md font-semibold">Ticket #</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold truncate max-w-full px-2" title={ticket.serviceLabel}>{ticket.serviceLabel}</span>
                    <span className="text-md font-semibold">Service</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-2xl font-bold">{ticket.stationName}</span>
                    <span className="text-md font-semibold">Window</span>
                </div>
            </div>
        </div>
    );
};

// Middle section: list of all currently served customers
const AllServingList = ({ tickets }: { tickets: ServingInfo[] }) => (
    <div className="flex flex-col bg-black/30 rounded-lg overflow-hidden flex-grow animate-pulse-slow border-2 border-yellow-400 shadow-lg">
        <h2 className="text-2xl font-bold text-center p-3 border-b-2 border-white/30 text-yellow-300">
            Currently Serving
        </h2>
        <div className="flex px-4 py-2 font-bold text-lg border-b border-white/20">
            <span className="w-1/3 text-left">Ticket #</span>
            <span className="w-1/3 text-left">Service</span>
            <span className="w-1/3 text-left">Window</span>
        </div>
        {tickets.length > 0 ? (
             <ScrollArea className="flex-grow">
                <ul className="divide-y divide-white/20">
                    {tickets.map((item) => (
                        <li key={`${item.ticketNumber}-${item.stationName}`} className="flex items-center p-4 text-xl font-bold">
                            <span className="truncate w-1/3 text-left">{item.ticketNumber}</span>
                            <span className="truncate w-1/3 text-left">{item.serviceLabel}</span>
                            <span className="truncate w-1/3 text-left">{item.stationName}</span>
                        </li>
                    ))}
                </ul>
            </ScrollArea>
        ) : (
            <div className="flex h-full items-center justify-center text-center text-slate-300 p-4">
                <p className="text-base">No tickets are being served right now.</p>
            </div>
        )}
    </div>
);

// Bottom section: list of all waiting customers
const WaitingQueue = ({ waitingTickets, serviceMap }: { waitingTickets: Ticket[], serviceMap: Map<string, string> }) => (
    <div className="flex flex-col bg-black/20 rounded-lg overflow-hidden h-full">
        <h2 className="text-2xl font-bold text-center p-3 border-b-2 border-white/30">Waiting Queue</h2>
        <div className="flex px-4 py-2 font-bold text-lg border-b border-white/20">
            <span className="w-1/2 text-left">Ticket #</span>
            <span className="w-1/2 text-left">Service</span>
        </div>
        <ScrollArea className="flex-grow">
            {waitingTickets.length > 0 ? (
                <ul className="divide-y divide-white/20">
                    {waitingTickets.map((item, index) => (
                        <li key={item.id} className={cn("flex items-center p-4 text-xl font-bold", index === 0 && "bg-white/10")}>
                            <span className="truncate w-1/2 text-left">{item.ticketNumber}</span>
                            <span className="truncate w-1/2 text-left">{serviceMap.get(item.type) || item.type}</span>
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
      <div className="flex-shrink-0">
        <MostRecentCard ticket={mostRecentTicket} />
      </div>

      {/* Middle and Bottom Sections in a grid to split remaining space */}
      <div className="flex-grow grid grid-rows-2 gap-4 min-h-0">
          {/* Middle Section: All Serving */}
          <AllServingList tickets={servingTickets} />

          {/* Bottom Section: Waiting */}
          <WaitingQueue waitingTickets={waitingTickets} serviceMap={serviceMap} />
      </div>
    </div>
  );
}
