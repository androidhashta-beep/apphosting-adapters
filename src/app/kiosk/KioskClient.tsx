"use client";

import { useQueue } from "@/contexts/QueueProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Ticket as TicketIcon, User, Award } from "lucide-react";
import type { TicketType, Ticket } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { PrintableTicket } from "./PrintableTicket";

export function KioskClient() {
  const { dispatch, state, isHydrated } = useQueue();
  const { toast } = useToast();
  const [ticketToPrint, setTicketToPrint] = useState<Ticket | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);
  const lastTicketCount = useRef(state.tickets.length);

  const getServiceLabel = (type: TicketType) => {
    switch(type) {
      case 'enrollment': return 'Enrollment';
      case 'payment': return 'Payment';
      case 'certificate': return 'Certificate Claiming';
      default: return 'Service';
    }
  };

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
        // Only trigger print if it was just created (e.g., within the last 5 seconds)
        // to avoid re-printing on page reloads.
        if (Date.now() - newTicket.createdAt < 5000) {
             setTicketToPrint(newTicket);
             toast({
                title: `Printing Ticket ${newTicket.ticketNumber}`,
                description: `Your ticket for ${getServiceLabel(newTicket.type)} is printing. Please take it from the printer.`,
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
                variant="outline"
                className="h-auto min-h-40 text-xl flex-col gap-2 rounded-lg shadow-lg transform transition-transform hover:scale-105 border-primary text-primary hover:bg-primary/5 whitespace-normal py-4"
                onClick={() => handleGetTicket("enrollment")}
                disabled={!isHydrated}
              >
                <User className="h-8 w-8" />
                <span>Enrollment</span>
                <p className="text-sm font-normal normal-case text-muted-foreground mt-1 px-2">
                  For inquiries, enrollment, and other related services.
                </p>
              </Button>
              <Button
                variant="outline"
                className="h-auto min-h-40 text-xl flex-col gap-2 rounded-lg shadow-lg transform transition-transform hover:scale-105 border-primary text-primary hover:bg-primary/5 whitespace-normal py-4"
                onClick={() => handleGetTicket("payment")}
                disabled={!isHydrated}
              >
                <TicketIcon className="h-8 w-8" />
                <span>Payment</span>
                <p className="text-sm font-normal normal-case text-muted-foreground mt-1 px-2">
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
