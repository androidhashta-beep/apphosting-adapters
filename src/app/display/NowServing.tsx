'use client';

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Ticket } from '@/lib/types';
import { History } from "lucide-react";

const NowServingCard = ({ ticketNumber, stationName }: { ticketNumber: string, stationName: string }) => (
    <div className="bg-yellow-400 text-black p-6 rounded-lg text-center animate-pulse-slow">
        <p className="text-sm uppercase tracking-widest font-semibold">Now Serving</p>
        <p className="text-8xl font-extrabold tracking-tight">{ticketNumber}</p>
        <p className="text-3xl font-bold">{stationName}</p>
    </div>
);

const PreviouslyCalledList = ({ tickets }: { tickets: { stationName: string; ticketNumber: string }[] }) => (
    <div className="flex flex-col bg-black/20 rounded-lg overflow-hidden h-full">
        <h2 className="text-xl font-bold text-center p-2 border-b-2 border-white/30 flex items-center justify-center gap-2">
            <History className="h-5 w-5" /> Previously Called
        </h2>
        {tickets.length > 0 ? (
             <ScrollArea className="flex-grow">
                <ul className="divide-y divide-white/20">
                    {tickets.map((item) => (
                        <li key={`${item.ticketNumber}-${item.stationName}`} className="flex items-center justify-between p-3 text-xl font-bold">
                            <span>{item.ticketNumber}</span>
                            <span className="text-base font-medium text-slate-300">{item.stationName}</span>
                        </li>
                    ))}
                </ul>
            </ScrollArea>
        ) : (
            <div className="flex h-full items-center justify-center text-center text-slate-300 p-4">
                <p className="text-base">No other tickets are being served.</p>
            </div>
        )}
    </div>
);

const WaitingQueue = ({ waitingTickets, serviceMap }: { waitingTickets: Ticket[], serviceMap: Map<string, string> }) => (
    <div className="flex flex-col bg-black/20 rounded-lg overflow-hidden h-full">
        <h2 className="text-xl font-bold text-center p-2 border-b-2 border-white/30">Waiting</h2>
        <ScrollArea className="flex-grow">
            {waitingTickets.length > 0 ? (
                <ul className="divide-y divide-white/20">
                    {waitingTickets.map((item, index) => (
                        <li key={item.id} className={cn("flex items-center justify-between p-3 text-2xl font-bold", index === 0 && "bg-white/10")}>
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

export function NowServing({ servingTickets, waitingTickets, serviceMap }: { servingTickets: { stationName: string; ticketNumber: string }[], waitingTickets: Ticket[], serviceMap: Map<string, string> }) {
    const mostRecentTicket = servingTickets.length > 0 ? servingTickets[0] : null;
    const previouslyCalledTickets = servingTickets.length > 1 ? servingTickets.slice(1) : [];

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex-shrink-0">
                 {mostRecentTicket ? (
                    <NowServingCard ticketNumber={mostRecentTicket.ticketNumber} stationName={mostRecentTicket.stationName} />
                ) : (
                    <div className="bg-white/10 text-white p-6 rounded-lg text-center h-[212px] flex flex-col justify-center">
                        <p className="text-2xl font-bold">No ticket is currently being served.</p>
                        <p className="text-base text-slate-300 mt-2">Waiting for the next customer to be called.</p>
                    </div>
                )}
            </div>
            <div className="flex-grow grid grid-cols-2 gap-4 min-h-0">
                <PreviouslyCalledList tickets={previouslyCalledTickets} />
                <WaitingQueue waitingTickets={waitingTickets} serviceMap={serviceMap} />
            </div>
        </div>
    );
}
