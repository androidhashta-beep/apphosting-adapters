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
            <div className="bg-yellow-400 text-black p-6 rounded-lg text-center flex items-center justify-center">
                <p className="text-2xl font-bold">Waiting for next customer...</p>
            </div>
        );
    }
    return (
       <div className="bg-yellow-400 text-black p-4 rounded-lg text-center">
            <p className="text-xs uppercase tracking-widest font-semibold mb-2">Now Serving</p>
            <div className="flex justify-around items-center text-center">
                <div className="w-1/3">
                    <p className="text-6xl font-extrabold tracking-tight">{ticket.ticketNumber}</p>
                    <p className="text-sm font-semibold">Ticket #</p>
                </div>
                <div className="w-1/3">
                    <p className="text-3xl font-bold truncate max-w-full px-2" title={ticket.serviceLabel}>{ticket.serviceLabel}</p>
                    <p className="text-sm font-semibold">Service</p>
                </div>
                <div className="w-1/3">
                    <p className="text-3xl font-bold">{ticket.stationName}</p>
                    <p className="text-sm font-semibold">Window</p>
                </div>
            </div>
        </div>
    );
};

// Middle section: list of all currently served customers
const AllServingList = ({ tickets }: { tickets: ServingInfo[] }) => (
    <div className="flex flex-col bg-black/30 rounded-lg overflow-hidden animate-pulse-slow border-2 border-yellow-400 shadow-lg">
        <h2 className="text-xl font-bold text-center p-2 border-b-2 border-white/30 text-yellow-300">
            Currently Serving
        </h2>
        <div className="flex px-3 py-1 font-bold text-base border-b border-white/20">
            <span className="w-1/3 text-left">Ticket #</span>
            <span className="w-1/3 text-left">Service</span>
            <span className="w-1/3 text-left">Window</span>
        </div>
        {tickets.length > 0 ? (
             <ScrollArea>
                <ul className="divide-y divide-white/20">
                    {tickets.map((item) => (
                        <li key={`${item.ticketNumber}-${item.stationName}`} className="flex items-center p-3 text-lg font-bold">
                            <span className="truncate w-1/3 text-left">{item.ticketNumber}</span>
                            <span className="truncate w-1/3 text-left">{item.serviceLabel}</span>
                            <span className="truncate w-1/3 text-left">{item.stationName}</span>
                        </li>
                    ))}
                </ul>
            </ScrollArea>
        ) : (
            <div className="flex h-24 items-center justify-center text-center text-slate-300 p-4">
                <p className="text-base">No tickets are being served right now.</p>
            </div>
        )}
    </div>
);

// Bottom section: list of all waiting customers
const WaitingQueue = ({ waitingTickets, serviceMap }: { waitingTickets: Ticket[], serviceMap: Map<string, string> }) => (
    <div className="flex flex-col bg-black/20 rounded-lg overflow-hidden flex-grow min-h-0">
        <h2 className="text-xl font-bold text-center p-2 border-b-2 border-white/30">Waiting Queue</h2>
        <div className="flex px-3 py-1 font-bold text-base border-b border-white/20">
            <span className="w-1/2 text-left">Ticket #</span>
            <span className="w-1/2 text-left">Service</span>
        </div>
        <ScrollArea className="flex-grow">
            {waitingTickets.length > 0 ? (
                <ul className="divide-y divide-white/20">
                    {waitingTickets.map((item, index) => (
                        <li key={item.id} className={cn("flex items-center p-3 text-lg font-bold", index === 0 && "bg-white/10")}>
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

      {/* Middle and Bottom Sections */}
      <div className="flex-grow flex flex-col gap-4 min-h-0">
          {/* Middle Section: All Serving */}
          <AllServingList tickets={servingTickets} />

          {/* Bottom Section: Waiting */}
          <WaitingQueue waitingTickets={waitingTickets} serviceMap={serviceMap} />
      </div>
    </div>
  );
}
