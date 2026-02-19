"use client";

import { useQueue } from "@/contexts/QueueProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { TicketType, Ticket, Service } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { PrintableTicket } from "./PrintableTicket";
import { Icon } from "@/lib/icons";

export function KioskClient() {
  const { dispatch, state, isHydrated } = useQueue();
  const { toast } = useToast();
  const [ticketToPrint, setTicketToPrint] = useState<Ticket | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);
  const lastTicketCount = useRef(state.tickets.length);
  const { settings } = state;

  useEffect(() => {
    if (ticketToPrint) {
      window.print();
      setTicketToPrint(null); // Reset after triggering print
    }
  }, [ticketToPrint]);

  useEffect(() => {
    // If a new ticket was added
    if (isHydrated && state.tickets.length > lastTicketCount.current) {
        const newTicket = state.tickets[state.tickets.length - 1];
        const service = settings.services.find(s => s.id === newTicket.type);
        
        if (Date.now() - newTicket.createdAt < 5000) {
             setTicketToPrint(newTicket);
             toast({
                title: `Printing Ticket ${newTicket.ticketNumber}`,
                description: `Your ticket for ${service?.label || 'a service'} is printing. Please take it from the printer.`,
                duration: 5000,
             });
        }
    }
    lastTicketCount.current = state.tickets.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tickets, isHydrated]);


  const handleGetTicket = (type: TicketType) => {
    dispatch({ type: "ADD_TICKET", payload: { type } });
  };
  
  const getPrintableService = (ticket: Ticket | null): Service | undefined => {
      if (!ticket) return undefined;
      return settings.services.find(s => s.id === ticket.type);
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground">Get Your Ticket</h2>
              <p className="text-muted-foreground mt-2">
                Please select the service you need. Your ticket will be printed automatically.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isHydrated && settings.services.map(service => (
                <Button
                  key={service.id}
                  variant="outline"
                  className="h-auto min-h-40 text-xl flex-col gap-2 rounded-lg shadow-lg transform transition-transform hover:scale-105 border-primary text-primary hover:bg-primary/5 whitespace-normal py-4"
                  onClick={() => handleGetTicket(service.id)}
                  disabled={!isHydrated}
                >
                  <Icon name={service.icon} className="h-8 w-8" />
                  <span>{service.label}</span>
                  <p className="text-sm font-normal normal-case text-muted-foreground mt-1 px-2">
                    {service.description}
                  </p>
                </Button>
              ))}
               {!isHydrated && Array.from({length: 3}).map((_, i) => (
                    <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="printable-area">
        <PrintableTicket ref={printableRef} ticket={ticketToPrint} companyName={settings.companyName} service={getPrintableService(ticketToPrint)} />
      </div>
    </>
  );
}
