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

// Redesigned for maximum impact and clarity
const MostRecentCard = ({ ticket }: { ticket: ServingInfo | null }) => {
    if (!ticket) {
        return (
            <div className="bg-slate-800 text-slate-400 rounded-lg text-center flex items-center justify-center h-full">
                <p className="text-3xl font-bold">Waiting for next customer...</p>
            </div>
        );
    }
    return (
       <div className="bg-gradient-to-br from-gold/80 to-gold text-black p-4 rounded-lg h-full flex flex-col justify-center items-center text-center shadow-[0_0_30px_-5px_hsl(var(--gold))]">
            <p className="text-2xl uppercase tracking-widest font-semibold opacity-80">Now Serving</p>
            <p className="font-extrabold tracking-tighter leading-none my-2" style={{ fontSize: 'clamp(5rem, 20vh, 12rem)' }}>
                {ticket.ticketNumber}
            </p>
            <div className="flex items-end justify-center gap-8 w-full">
                 <div className="flex-1 min-w-0">
                    <p className="text-3xl font-bold truncate">{ticket.serviceLabel}</p>
                    <p className="text-lg font-semibold opacity-80">Service</p>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-3xl font-bold truncate">{ticket.stationName}</p>
                    <p className="text-lg font-semibold opacity-80">Window</p>
                </div>
            </div>
        </div>
    );
};

// List for all others being served
const AllServingList = ({ tickets }: { tickets: ServingInfo[] }) => (
    <div className="flex flex-col bg-black/30 rounded-lg overflow-hidden h-full">
        <h2 className="text-xl font-bold text-center p-3 text-gold flex-shrink-0">
            Also Serving
        </h2>
        <div className="grid grid-cols-3 px-4 py-2 font-semibold text-white/70 border-y border-white/10 flex-shrink-0">
            <span className="text-left">Ticket #</span>
            <span className="text-left">Service</span>
            <span className="text-right">Window</span>
        </div>
        {tickets.length > 0 ? (
             <ScrollArea className="flex-grow">
                <ul className="divide-y divide-white/10">
                    {tickets.map((item) => (
                        <li key={`${item.ticketNumber}-${item.stationName}`} className="grid grid-cols-3 items-center px-4 py-3 font-medium">
                            <span className="text-left truncate text-3xl font-bold">{item.ticketNumber}</span>
                            <span className="text-left truncate text-xl">{item.serviceLabel}</span>
                            <span className="text-right truncate text-xl">{item.stationName}</span>
                        </li>
                    ))}
                </ul>
            </ScrollArea>
        ) : (
            <div className="flex h-full items-center justify-center text-center text-slate-400 p-4">
                <p className="text-lg">No other customers are being served.</p>
            </div>
        )}
    </div>
);

// List for the waiting queue
const WaitingQueue = ({ waitingTickets, serviceMap }: { waitingTickets: Ticket[], serviceMap: Map<string, string> }) => (
    <div className="flex flex-col bg-black/20 rounded-lg overflow-hidden h-full">
        <h2 className="text-xl font-bold text-center p-3 flex-shrink-0">Waiting Queue</h2>
        <div className="grid grid-cols-2 px-4 py-2 font-semibold text-white/70 border-y border-white/10 flex-shrink-0">
            <span className="text-left">Ticket #</span>
            <span className="text-left">Service</span>
        </div>
        <ScrollArea className="flex-grow">
            {waitingTickets.length > 0 ? (
                <ul className="divide-y divide-white/10">
                    {waitingTickets.slice(0, 50).map((item, index) => ( // Limit to 50 to prevent performance issues
                        <li key={item.id} className={cn(
                            "grid grid-cols-2 items-center px-4 py-3 font-medium",
                        )}>
                            <span className="text-left truncate text-3xl font-bold">{item.ticketNumber}</span>
                            <span className="text-left truncate text-xl">{serviceMap.get(item.type) || item.type}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex h-full items-center justify-center text-center text-slate-400">
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

  // The "AllServingList" should show all tickets *except* the most recent one.
  const otherServingTickets = servingTickets.slice(1);

  return (
    // Use a grid layout to enforce three equal rows
    <div className="h-full grid grid-rows-3 gap-4">
      {/* Top Row: Most Recent */}
      <div className="min-h-0">
        <MostRecentCard ticket={mostRecentTicket} />
      </div>

      {/* Middle Row: All Other Serving */}
      <div className="min-h-0">
          <AllServingList tickets={otherServingTickets} />
      </div>

      {/* Bottom Row: Waiting */}
      <div className="min-h-0">
          <WaitingQueue waitingTickets={waitingTickets} serviceMap={serviceMap} />
      </div>
    </div>
  );
}
