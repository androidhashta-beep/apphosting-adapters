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

// Top card for the single most recent ticket, redesigned for impact.
const MostRecentCard = ({ ticket }: { ticket: ServingInfo | null }) => {
    if (!ticket) {
        return (
            <div className="bg-slate-800 text-slate-400 p-4 rounded-lg text-center flex items-center justify-center h-full">
                <p className="text-3xl font-bold">Waiting for next customer...</p>
            </div>
        );
    }
    return (
       <div className="bg-gold text-black p-6 rounded-lg text-center h-full flex flex-col justify-center shadow-[0_0_30px_5px_hsl(var(--gold))]">
            <p className="text-2xl uppercase tracking-widest font-semibold mb-4 flex-shrink-0">Now Serving</p>
            <div className="grid grid-cols-3 items-center text-center flex-grow min-w-0 gap-4">
                {/* Ticket Number Column */}
                <div className="flex flex-col justify-center items-center h-full px-2 min-w-0">
                    <p className="font-extrabold tracking-tight leading-none truncate text-[10rem]">{ticket.ticketNumber}</p>
                    <p className="text-2xl font-semibold mt-2">Ticket #</p>
                </div>
                {/* Service Column */}
                <div className="flex flex-col justify-center items-center h-full px-2 min-w-0">
                    <p className="text-5xl font-bold truncate" title={ticket.serviceLabel}>{ticket.serviceLabel}</p>
                    <p className="text-2xl font-semibold mt-2">Service</p>
                </div>
                {/* Window Column */}
                <div className="flex flex-col justify-center items-center h-full px-2 min-w-0">
                    <p className="text-5xl font-bold truncate">{ticket.stationName}</p>
                    <p className="text-2xl font-semibold mt-2">Window</p>
                </div>
            </div>
        </div>
    );
};

// Middle section: list of all currently served customers
const AllServingList = ({ tickets }: { tickets: ServingInfo[] }) => (
    <div className="flex flex-col bg-black/30 rounded-lg overflow-hidden h-full">
        <h2 className="text-3xl font-bold text-center p-3 border-b-2 border-white/20 text-gold flex-shrink-0">
            Currently Serving
        </h2>
        <div className="grid grid-cols-3 px-6 py-2 font-semibold text-xl text-white/70 border-b border-white/20 flex-shrink-0">
            <span className="text-left">Ticket #</span>
            <span className="text-left">Service</span>
            <span className="text-left">Window</span>
        </div>
        {tickets.length > 0 ? (
             <ScrollArea className="flex-grow">
                <ul className="divide-y divide-white/10">
                    {tickets.map((item) => (
                        <li key={`${item.ticketNumber}-${item.stationName}`} className="grid grid-cols-3 items-center px-6 py-3 font-medium">
                            <span className="text-left truncate text-5xl font-bold">{item.ticketNumber}</span>
                            <span className="text-left truncate text-3xl">{item.serviceLabel}</span>
                            <span className="text-left truncate text-3xl">{item.stationName}</span>
                        </li>
                    ))}
                </ul>
            </ScrollArea>
        ) : (
            <div className="flex h-full items-center justify-center text-center text-slate-400 p-4">
                <p className="text-2xl">No other tickets are being served.</p>
            </div>
        )}
    </div>
);

// Bottom section: list of all waiting customers
const WaitingQueue = ({ waitingTickets, serviceMap }: { waitingTickets: Ticket[], serviceMap: Map<string, string> }) => (
    <div className="flex flex-col bg-black/20 rounded-lg overflow-hidden h-full">
        <h2 className="text-3xl font-bold text-center p-3 border-b-2 border-white/20 flex-shrink-0">Waiting Queue</h2>
        <div className="grid grid-cols-2 px-6 py-2 font-semibold text-xl text-white/70 border-b border-white/20 flex-shrink-0">
            <span className="text-left">Ticket #</span>
            <span className="text-left">Service</span>
        </div>
        <ScrollArea className="flex-grow">
            {waitingTickets.length > 0 ? (
                <ul className="divide-y divide-white/10">
                    {waitingTickets.map((item, index) => (
                        <li key={item.id} className={cn(
                            "grid grid-cols-2 items-center px-6 py-3 font-medium", 
                            index === 0 && "bg-white/10"
                        )}>
                            <span className="text-left truncate text-5xl font-bold">{item.ticketNumber}</span>
                            <span className="text-left truncate text-3xl">{serviceMap.get(item.type) || item.type}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex h-full items-center justify-center text-center text-slate-400">
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

  // The "AllServingList" should show all tickets *except* the most recent one.
  const otherServingTickets = servingTickets.slice(1);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Section: Most Recent */}
      <div className="flex-1 min-h-0">
        <MostRecentCard ticket={mostRecentTicket} />
      </div>

      {/* Middle Section: All Other Serving */}
      <div className="flex-1 min-h-0">
          <AllServingList tickets={otherServingTickets} />
      </div>

      {/* Bottom Section: Waiting */}
      <div className="flex-1 min-h-0">
          <WaitingQueue waitingTickets={waitingTickets} serviceMap={serviceMap} />
      </div>
    </div>
  );
}
