"use client";

import { useQueue } from "@/contexts/QueueProvider";
import type { Station, StationStatus, TicketType, Ticket } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Megaphone, Check, SkipForward, Ban, Award, User, Ticket as TicketIcon, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

// The component now takes the full station and tickets array as props.
export function StationControlCard({ station, tickets }: { station: Station, tickets: Ticket[] }) {
  // We only need the dispatch function from the context.
  const { dispatch } = useQueue();
  const { toast } = useToast();

  // Find the current ticket from the provided tickets array.
  const ticket = tickets.find(t => t.id === station.currentTicketId);
  const isClosed = station.status === 'closed';

  const announce = (ticketNumber: string, stationName: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const text = `Ticket number ${ticketNumber}, please go to ${stationName}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };
  
  // This effect triggers the announcement when a new ticket is assigned to this station.
  useEffect(() => {
      if (ticket && ticket.status === 'serving' && ticket.calledAt && (Date.now() - ticket.calledAt < 5000)) {
          announce(ticket.ticketNumber, station.name);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id]); // Only re-run when the ticket ID changes.

  const callAgain = () => {
    if (ticket) {
      announce(ticket.ticketNumber, station.name);
    }
  };

  const completeTicket = () => {
    if (ticket) {
      dispatch({ type: 'COMPLETE_TICKET', payload: { stationId: station.id } });
    }
  };

  const skipTicket = () => {
    if (ticket) {
      dispatch({ type: 'SKIP_TICKET', payload: { stationId: station.id } });
    }
  };

  const callNext = (ticketType: TicketType) => {
    dispatch({ type: 'CALL_NEXT_TICKET', payload: { stationId: station.id, ticketType } });
  };

  const getCallButton = (type: TicketType, label: string, icon: React.ReactNode) => {
    // Calculate waiting count from the tickets prop.
    const waitingCount = tickets.filter(t => t.type === type && t.status === 'waiting').length;
    const isQueueEmpty = waitingCount === 0;

    return (
        <Button onClick={() => callNext(type)} className="w-full justify-between" disabled={isClosed || isQueueEmpty}>
            <div className="flex items-center gap-2">
                {icon}
                <span>{label}</span>
            </div>
            <span className="bg-primary-foreground/20 text-primary-foreground rounded-full px-2 text-xs">{waitingCount}</span>
        </Button>
    )
  }

  return (
    <Card className={cn("flex flex-col", isClosed && "bg-muted/50")}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{station.name}</span>
          <div className="flex items-center space-x-2">
            <Switch
              id={`status-${station.id}`}
              checked={!isClosed}
              onCheckedChange={(checked) => {
                const newStatus: StationStatus = checked ? 'open' : 'closed';
                dispatch({ type: 'UPDATE_STATION_STATUS', payload: { stationId: station.id, status: newStatus } });
              }}
              aria-label={`Toggle station ${station.name}`}
            />
            <Label htmlFor={`status-${station.id}`}>{isClosed ? "Closed" : "Open"}</Label>
          </div>
        </CardTitle>
        <CardDescription>
          Mode: <span className="font-semibold capitalize">{station.mode}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Now Serving</p>
        <div className="h-16 flex items-center justify-center">
          <p className="text-4xl font-bold">{ticket?.ticketNumber || '-'}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Separator className="mb-2" />
        {ticket ? (
          <>
            <Button onClick={callAgain} variant="secondary" className="w-full">
              <Volume2 /> Call Again
            </Button>
            <Button onClick={completeTicket} className="w-full bg-green-600 hover:bg-green-700">
              <Check /> Complete Service
            </Button>
            <Button onClick={skipTicket} variant="outline" className="w-full">
              <SkipForward /> Skip Ticket
            </Button>
          </>
        ) : (
          <>
            {(() => {
              switch (station.mode) {
                case 'all-in-one':
                  return (
                    <div className="w-full space-y-2">
                      {getCallButton('enrollment', 'Call Enrollment', <User />)}
                      {getCallButton('payment', 'Call Payment', <TicketIcon />)}
                      {getCallButton('certificate', 'Call Certificate', <Award />)}
                    </div>
                  );
                case 'payment-only':
                  return getCallButton('payment', 'Call Payment', <TicketIcon />);
                case 'certificate-only':
                  return getCallButton('certificate', 'Call Certificate', <Award />);
                case 'regular':
                default:
                  // Make label more readable
                  const typeLabel = station.type.charAt(0).toUpperCase() + station.type.slice(1);
                  return getCallButton(station.type, `Call Next ${typeLabel}`, <Megaphone />);
              }
            })()}
            {!isClosed && (
              <Button variant="ghost" className="w-full text-muted-foreground" disabled>
                <Ban /> No ticket serving
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
