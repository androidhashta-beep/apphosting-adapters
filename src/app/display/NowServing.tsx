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
            <p className="text-sm uppercase tracking-widest font-semibold">Now Serving</p>
            <p className="text-8xl font-extrabold tracking-tight">{ticket.ticketNumber}</p>
            <p className="text-3xl font-bold">{ticket.stationName}</p>
        </div>
    );
};

// Middle section: list of all currently served customers
const AllServingList = ({ tickets }: { tickets: ServingInfo[] }) => (
    <div className="flex flex-col bg-black/30 rounded-lg overflow-hidden flex-grow animate-pulse-slow border-2 border-yellow-400 shadow-lg">
        <h2 className="text-2xl font-bold text-center p-3 border-b-2 border-white/30 text-yellow-300">
            Currently Serving
        </h2>
        <div className="grid grid-cols-3 px-4 py-2 font-bold text-lg border-b border-white/20">
            <span>Ticket #</span>
            <span>Window</span>
            <span>Service</span>
        </div>
        {tickets.length > 0 ? (
             <ScrollArea className="flex-grow">
                <ul className="divide-y divide-white/20">
                    {tickets.map((item) => (
                        <li key={`${item.ticketNumber}-${item.stationName}`} className="grid grid-cols-3 items-center p-4 text-2xl font-bold">
                            <span>{item.ticketNumber}</span>
                            <span className="text-lg font-medium text-slate-200">{item.stationName}</span>
                            <span className="text-lg font-medium text-slate-200">{item.serviceLabel}</span>
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
        <div className="grid grid-cols-2 px-4 py-2 font-bold text-lg border-b border-white/20">
            <span>Ticket #</span>
            <span>Service</span>
        </div>
        <ScrollArea className="flex-grow">
            {waitingTickets.length > 0 ? (
                <ul className="divide-y divide-white/20">
                    {waitingTickets.map((item, index) => (
                        <li key={item.id} className={cn("grid grid-cols-2 items-center p-4 text-2xl font-bold", index === 0 && "bg-white/10")}>
                            <span>{item.ticketNumber}</span>
                            <span className="text-lg font-medium text-slate-300">{serviceMap.get(item.type) || item.type}</span>
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
