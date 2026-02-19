"use client";

import { useQueue } from "@/contexts/QueueProvider";
import type { Station, StationStatus, TicketType } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Megaphone, Check, SkipForward, Ban, Award, User, Ticket, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

// Use a more specific prop name to avoid confusion with the live state object.
export function StationControlCard({ station: initialStation }: { station: Station }) {
  const { state, dispatch } = useQueue();
  const { toast } = useToast();

  // Always use the station object from the central state for dynamic data.
  // This ensures the component re-renders with the latest status, mode, etc.
  const station = state.stations.find(s => s.id === initialStation.id) || initialStation;
  
  const ticket = state.tickets.find(t => t.id === station.currentTicketId);
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
      if (ticket && ticket.status === 'serving' && ticket.calledAt && (Date.now() - ticket.calledAt < 3000)) {
          announce(ticket.ticketNumber, station.name);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id]);

  const handleStatusChange = (checked: boolean) => {
    const newStatus: StationStatus = checked ? 'open' : 'closed';
    dispatch({ type: 'UPDATE_STATION_STATUS', payload: { stationId: station.id, status: newStatus } });
  };

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
    // This is the single source of truth for calling the next ticket.
    // The button's disabled state prevents this from being called with an empty queue.
    dispatch({ type: 'CALL_NEXT_TICKET', payload: { stationId: station.id, ticketType } });
  };

  const getCallButton = (type: TicketType, label: string, icon: React.ReactNode) => {
    const waitingCount = state.tickets.filter(t => t.type === type && t.status === 'waiting').length;
    const isQueueEmpty = waitingCount === 0;

    // The button is disabled if the station is closed or the specific queue is empty.
    // The onClick now directly calls `callNext`.
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
              onCheckedChange={handleStatusChange}
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
                      {getCallButton('payment', 'Call Payment', <Ticket />)}
                      {getCallButton('certificate', 'Call Certificate', <Award />)}
                    </div>
                  );
                case 'payment-only':
                  return getCallButton('payment', 'Call Payment', <Ticket />);
                case 'certificate-only':
                  return getCallButton('certificate', 'Call Certificate', <Award />);
                case 'regular':
                default:
                  return getCallButton(station.type, `Call Next ${station.type}`, <Megaphone />);
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
