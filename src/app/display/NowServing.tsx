
'use client';

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Ticket } from '@/lib/types';
import React from 'react';

type ServingInfo = {
    stationName: string;
    ticketNumber: string;
    serviceLabel: string;
    calledAt: any;
};

const MostRecentCard = ({ ticket }: { ticket: ServingInfo | null }) => {
    if (!ticket) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 text-slate-300 rounded-xl text-center flex items-center justify-center h-full p-4">
                <p className="text-3xl font-bold">Waiting for next customer...</p>
            </div>
        );
    }
    return (
       <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-black p-6 rounded-xl h-full flex flex-col justify-around items-center text-center shadow-2xl relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full" />
             <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full" />
            <h2 className="text-2xl uppercase tracking-widest font-semibold opacity-80 z-10">Now Serving</h2>
            
            <p
                className="font-extrabold tracking-tighter leading-none z-10"
                style={{ fontSize: 'clamp(6rem, 18vh, 12rem)' }}
            >
                {ticket.ticketNumber}
            </p>
            
            <div className="text-center z-10">
                 <p className="text-xl font-semibold opacity-70 -mb-1">Please proceed to</p>
                 <p className="text-4xl font-bold truncate">{ticket.stationName}</p>
            </div>
        </div>
    );
};

const QueueList = ({ title, children, headers }: { title: string; children: React.ReactNode; headers: string[] }) => (
    <div className="flex flex-col bg-black/30 rounded-xl overflow-hidden h-full">
        <h2 className="text-xl font-bold text-center p-3 text-white/90 flex-shrink-0 border-b border-white/10">
            {title}
        </h2>
        <div className="grid grid-cols-2 px-4 py-1 font-semibold text-white/70 flex-shrink-0">
            <span className="text-left text-sm">{headers[0]}</span>
            <span className="text-left text-sm">{headers[1]}</span>
        </div>
        <ScrollArea className="flex-grow pr-1">
            {React.Children.count(children) > 0 ? (
                <div className="grid grid-cols-1 items-center px-4 gap-y-1">
                    {children}
                </div>
            ) : (
                <div className="flex h-full items-center justify-center text-center text-slate-400 p-4">
                    <p>The queue is empty.</p>
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
  const otherServingTickets = servingTickets.slice(1);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Row: Most Recent */}
      <div className="flex-1 min-h-0">
        <MostRecentCard ticket={mostRecentTicket} />
      </div>

      {/* Bottom Row: Split into Also Serving and Waiting */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
          <QueueList title="Also Serving" headers={['Ticket #', 'Window']}>
            {otherServingTickets.map(item => (
                <div key={`${item.ticketNumber}-${item.stationName}`} className="grid grid-cols-2 items-center py-2 border-b border-white/10 last:border-none">
                    <p className="text-left truncate text-3xl font-bold">{item.ticketNumber}</p>
                    <p className="text-left truncate text-xl self-center">{item.stationName}</p>
                </div>
            ))}
          </QueueList>

          <QueueList title="Waiting" headers={['Ticket #', 'Service']}>
            {waitingTickets.slice(0, 50).map(item => (
                 <div key={item.id} className="grid grid-cols-2 items-center py-2 border-b border-white/10 last:border-none">
                    <p className="text-left truncate text-3xl font-bold">{item.ticketNumber}</p>
                    <p className="text-left truncate text-xl self-center">{serviceMap.get(item.type) || item.type}</p>
                </div>
            ))}
          </QueueList>
      </div>
    </div>
  );
}
