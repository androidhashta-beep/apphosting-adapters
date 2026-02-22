
"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Ticket } from '@/lib/types';

type WaitingQueueProps = {
  waitingTickets: Ticket[];
  serviceMap: Map<string, string>;
};

export function NowServing({ waitingTickets, serviceMap }: WaitingQueueProps) {
  
  return (
    <div className="h-full flex flex-col">
        {/* Main Header */}
        <div className="grid grid-cols-2 gap-x-2 px-4 pt-2 pb-1 border-b-2 border-white/50 flex-shrink-0">
            <h2 className="text-xl font-bold text-left">Service</h2>
            <h2 className="text-xl font-bold text-center">Ticket</h2>
        </div>

        {/* Scrollable content area */}
        <ScrollArea className="flex-grow">
            {/* Waiting List */}
            {waitingTickets.length > 0 ? (
                <ul className="flex flex-col">
                {waitingTickets.map((item) => (
                    <li
                    key={item.id}
                    className={cn(
                        "grid grid-cols-2 items-center gap-x-2 px-4 py-2 text-3xl font-extrabold border-b border-white/20",
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
}
