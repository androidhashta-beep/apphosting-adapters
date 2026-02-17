"use client";

import { useQueue } from "@/contexts/QueueProvider";
import { NowServingCard } from "./NowServingCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ticket } from "@/lib/types";

export function DisplayClient() {
  const { state, getWaitingTickets, getServedTickets } = useQueue();

  const counterWaiting = getWaitingTickets("counter");
  const cashierWaiting = getWaitingTickets("cashier");
  const certificateWaiting = getWaitingTickets("certificate");
  
  const counterHistory = getServedTickets("counter").slice(0, 4);
  const cashierHistory = getServedTickets("cashier").slice(0, 4);
  const certificateHistory = getServedTickets("certificate").slice(0, 4);


  return (
    <div className="w-full space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-center text-primary mb-6">
          Now Serving
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {state.stations.map((station) => (
            <NowServingCard key={station.id} station={station} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <QueueInfoColumn title="Counter Queue" waiting={counterWaiting} history={counterHistory} />
        <QueueInfoColumn title="Cashier Queue" waiting={cashierWaiting} history={cashierHistory} />
        <QueueInfoColumn title="Certificate Queue" waiting={certificateWaiting} history={certificateHistory} />
      </div>
    </div>
  );
}

const QueueInfoColumn = ({ title, waiting, history }: { title: string, waiting: Ticket[], history: Ticket[] }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="text-2xl text-center">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <QueueList title="Waiting" tickets={waiting} emptyMessage="No one is waiting." />
      <QueueList title="Recently Called" tickets={history} emptyMessage="No recent calls." />
    </CardContent>
  </Card>
);

const QueueList = ({ title, tickets, emptyMessage }: { title: string, tickets: Ticket[], emptyMessage: string }) => (
  <div>
    <h3 className="text-lg font-semibold mb-3 text-muted-foreground">{title}</h3>
    <Card className="bg-background/50">
      <CardContent className="p-4 min-h-[120px]">
        {tickets.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-card border rounded-md p-2 text-center font-semibold text-lg animate-in fade-in-50">
                {ticket.ticketNumber}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground pt-8">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  </div>
);
