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
                <p className="text-4xl font-bold">Waiting for next customer...</p>
            </div>
        );
    }
    return (
       <div className="bg-primary text-primary-foreground p-6 rounded-xl h-full flex flex-col justify-around items-center text-center shadow-2xl">
            <h2 className="text-3xl uppercase tracking-widest font-semibold opacity-90">Now Serving</h2>
            
            <p
                className="font-extrabold tracking-tighter leading-none"
                style={{ fontSize: 'clamp(8rem, 22vh, 16rem)' }}
            >
                {ticket.ticketNumber}
            </p>
            
            <div className="text-center">
                 <p className="text-2xl font-semibold opacity-80 -mb-1">Please proceed to</p>
                 <p className="text-5xl font-bold truncate">{ticket.stationName}</p>
            </div>
        </div>
    );
};

const QueueList = ({ title, children, headers }: { title: string; children: React.ReactNode; headers: string[] }) => (
    <div className="flex flex-col bg-black/30 rounded-xl overflow-hidden h-full">
        <h2 className="text-2xl font-bold text-center p-3 text-white/90 flex-shrink-0">
            {title}
        </h2>
        <div className="grid grid-cols-2 px-4 py-2 font-semibold text-white/70 border-y border-white/10 flex-shrink-0">
            <span className="text-left">{headers[0]}</span>
            <span className="text-left">{headers[1]}</span>
        </div>
        <ScrollArea className="flex-grow">
            {React.Children.count(children) > 0 ? (
                <div className="grid grid-cols-2 items-center px-4 gap-x-4">
                    {children}
                </div>
            ) : (
                <div className="flex h-full items-center justify-center text-center text-slate-400 p-4">
                    <p className="text-lg">The queue is empty.</p>
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
    <div className="h-full grid grid-rows-2 gap-4">
      {/* Top Row: Most Recent */}
      <div className="min-h-0">
        <MostRecentCard ticket={mostRecentTicket} />
      </div>

      {/* Bottom Row: Split into Also Serving and Waiting */}
      <div className="min-h-0 grid grid-cols-2 gap-4">
          <QueueList title="Also Serving" headers={['Ticket #', 'Window']}>
            {otherServingTickets.map(item => (
                <React.Fragment key={`${item.ticketNumber}-${item.stationName}`}>
                    <p className="text-left truncate text-4xl font-bold py-2 border-b border-white/10">{item.ticketNumber}</p>
                    <p className="text-left truncate text-2xl self-center py-2 border-b border-white/10">{item.stationName}</p>
                </React.Fragment>
            ))}
          </QueueList>

          <QueueList title="Waiting" headers={['Ticket #', 'Service']}>
            {waitingTickets.slice(0, 50).map(item => (
                 <React.Fragment key={item.id}>
                    <p className="text-left truncate text-4xl font-bold py-2 border-b border-white/10">{item.ticketNumber}</p>
                    <p className="text-left truncate text-2xl self-center py-2 border-b border-white/10">{serviceMap.get(item.type) || item.type}</p>
                </React.Fragment>
            ))}
          </QueueList>
      </div>
    </div>
  );
}
