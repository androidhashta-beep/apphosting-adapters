"use client";

import { useQueue } from "@/contexts/QueueProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Ticket as TicketIcon, User, Award, Printer } from "lucide-react";
import type { TicketType, Ticket } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { PrintableTicket } from "./PrintableTicket";

export function KioskClient() {
  const { dispatch, state, isHydrated } = useQueue();
  const { toast } = useToast();
  const [ticketToPrint, setTicketToPrint] = useState<Ticket | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticketToPrint) {
      window.print();
      setTicketToPrint(null); // Reset after triggering print
    }
  }, [ticketToPrint]);

  const handleGetTicket = (type: TicketType) => {
    const now = Date.now();
    const isNewDay = state.lastTicketTimestamp
        ? new Date(state.lastTicketTimestamp).toDateString() !== new Date(now).toDateString()
        : true;

    const ticketsForNumbering = isNewDay ? [] : state.tickets;
    
    const prefix = type === 'enrollment' ? 'E' : type === 'payment' ? 'P' : 'R';
    const lastTicketOfType = ticketsForNumbering
      .filter((t) => t.type === type)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    const newNumber = lastTicketOfType
      ? parseInt(lastTicketOfType.ticketNumber.split('-')[1]) + 1
      : 1;
    const ticketNumber = `${prefix}-${newNumber}`;

    const newTicket: Ticket = {
        id: `${type}-${newNumber}-${now}`,
        ticketNumber: ticketNumber,
        type,
        status: 'waiting',
        createdAt: now,
    };

    dispatch({ type: "ADD_TICKET", payload: { ticket: newTicket } });
    
    // Immediately trigger the print dialog
    setTicketToPrint(newTicket);

    toast({
      title: "Printing Ticket...",
      description: `Now printing ticket ${newTicket.ticketNumber}. Please take it from the printer.`,
      duration: 5000,
    });
  };

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
              <Button
                variant="default"
                className="h-auto min-h-40 text-xl flex-col gap-2 rounded-lg shadow-lg transform transition-transform hover:scale-105 whitespace-normal py-4"
                onClick={() => handleGetTicket("enrollment")}
                disabled={!isHydrated}
              >
                <User className="h-8 w-8" />
                <span>Enrollment</span>
                <p className="text-sm font-normal normal-case text-primary-foreground/80 mt-1 px-2">
                  For inquiries, enrollment, and other related services.
                </p>
              </Button>
              <Button
                variant="secondary"
                className="h-auto min-h-40 text-xl flex-col gap-2 rounded-lg shadow-lg bg-accent text-accent-foreground hover:bg-accent/90 transform transition-transform hover:scale-105 whitespace-normal py-4"
                onClick={() => handleGetTicket("payment")}
                disabled={!isHydrated}
              >
                <TicketIcon className="h-8 w-8" />
                <span>Payment</span>
                <p className="text-sm font-normal normal-case text-accent-foreground/80 mt-1 px-2">
                  Exclusive for payment services only.
                </p>
              </Button>
              <Button
                variant="outline"
                className="h-auto min-h-40 text-xl flex-col gap-2 rounded-lg shadow-lg transform transition-transform hover:scale-105 border-primary text-primary hover:bg-primary/5 whitespace-normal py-4"
                onClick={() => handleGetTicket("certificate")}
                disabled={!isHydrated}
              >
                <Award className="h-8 w-8" />
                <span>Claim Certificate</span>
                <p className="text-sm font-normal normal-case text-muted-foreground mt-1 px-2">
                  Exclusive for claiming of certificates.
                </p>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="printable-area">
        <PrintableTicket ref={printableRef} ticket={ticketToPrint} companyName="Renaissance Training Center Inc." />
      </div>
    </>
  );
}
