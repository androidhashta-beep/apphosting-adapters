"use client";

import { useQueue } from "@/contexts/QueueProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Ticket, User, Award } from "lucide-react";
import type { TicketType } from "@/lib/types";

export function KioskClient() {
  const { state, dispatch } = useQueue();
  const { toast } = useToast();

  const handleGetTicket = (type: TicketType) => {
    // We need to calculate the next ticket number here to show it in the toast.
    // This duplicates logic from the reducer, but it's for UI feedback only.
    const prefix = type === 'counter' ? 'C' : type === 'cashier' ? 'S' : 'R';
    const lastTicketOfType = state.tickets
      .filter((t) => t.type === type)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    const newNumber = lastTicketOfType
      ? parseInt(lastTicketOfType.ticketNumber.split('-')[1]) + 1
      : 101;
    const ticketNumber = `${prefix}-${newNumber}`;

    dispatch({ type: "ADD_TICKET", payload: { type } });

    toast({
      title: "Ticket Generated!",
      description: `Your ticket number is ${ticketNumber}. Please wait for your turn.`,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-4xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Get Your Ticket</h2>
            <p className="text-muted-foreground mt-2">
              Please select the service you need.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button
              variant="default"
              className="h-40 text-xl flex-col gap-2 rounded-lg shadow-lg transform transition-transform hover:scale-105"
              onClick={() => handleGetTicket("counter")}
            >
              <User className="h-8 w-8" />
              <span>Counter Service</span>
              <p className="text-sm font-normal normal-case text-primary-foreground/80 mt-1 px-2 whitespace-normal">
                For inquiries, enrollment, and payments if cashier is unavailable.
              </p>
            </Button>
            <Button
              variant="secondary"
              className="h-40 text-xl flex-col gap-2 rounded-lg shadow-lg bg-accent text-accent-foreground hover:bg-accent/90 transform transition-transform hover:scale-105"
              onClick={() => handleGetTicket("cashier")}
            >
              <Ticket className="h-8 w-8" />
              <span>Cashier Service</span>
              <p className="text-sm font-normal normal-case text-accent-foreground/80 mt-1 px-2 whitespace-normal">
                Exclusive for payment services only.
              </p>
            </Button>
            <Button
              variant="outline"
              className="h-40 text-xl flex-col gap-2 rounded-lg shadow-lg transform transition-transform hover:scale-105 border-primary text-primary hover:bg-primary/5"
              onClick={() => handleGetTicket("certificate")}
            >
              <Award className="h-8 w-8" />
              <span>Claim Certificate</span>
              <p className="text-sm font-normal normal-case text-muted-foreground mt-1 px-2 whitespace-normal">
                Exclusive for claiming of certificates.
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
