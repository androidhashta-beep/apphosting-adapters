"use client";

import { useQueue } from "@/contexts/QueueProvider";
import type { Station, StationStatus, TicketType, Ticket } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Megaphone, Check, SkipForward, Ban, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/lib/icons";

export function StationControlCard({ 
  station,
  waitingCounts,
}: { 
  station: Station;
  waitingCounts: { [key: string]: number };
}) {
  const { state, dispatch } = useQueue();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const ticket = state.tickets.find(t => t.id === station.currentTicketId);
  
  // Get available voices from the browser
  useEffect(() => {
    const handleVoicesChanged = () => {
        setVoices(window.speechSynthesis.getVoices());
    };
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.getVoices().length > 0) {
            setVoices(window.speechSynthesis.getVoices());
        }
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        
        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        };
    }
  }, []);

  const announce = useCallback((ticketNumber: string, stationName: string, ticketType: TicketType) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();

    const service = state.settings.services.find(s => s.id === ticketType);
    const serviceLabel = service ? service.label : ticketType;

    const text = `Customer number ${ticketNumber}, For ${serviceLabel} please go to ${stationName}.`;
    const utterance = new SpeechSynthesisUtterance(text);

    const filipinoMaleVoice = voices.find(voice => 
        voice.lang.startsWith('fil') &&
        /male/i.test(voice.name)
    );

    if (filipinoMaleVoice) {
      utterance.voice = filipinoMaleVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [voices, state.settings.services]);

  useEffect(() => {
    if (ticket && ticket.status === 'serving' && ticket.calledAt && (Date.now() - ticket.calledAt < 5000)) {
      announce(ticket.ticketNumber, station.name, ticket.type);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id, ticket?.calledAt, announce]);

  if (!station) {
    return <Skeleton className="h-[480px] rounded-lg" />;
  }
  
  const isClosed = station.status === 'closed';

  const callAgain = () => {
    if (ticket) {
      announce(ticket.ticketNumber, station.name, ticket.type);
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
    const waitingCount = waitingCounts[type] || 0;
    const isQueueEmpty = waitingCount === 0;
    const isDisabled = isClosed || isQueueEmpty;

    return (
        <Button onClick={() => callNext(type)} className="w-full justify-between" disabled={isDisabled}>
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
                      {state.settings.services.map(service => getCallButton(service.id, `Call ${service.label}`, <Icon name={service.icon} />))}
                    </div>
                  );
                case 'payment-only':
                   return getCallButton('payment', 'Call Payment', <Icon name="Ticket" />);
                case 'certificate-only':
                  return getCallButton('certificate', 'Call Certificate', <Icon name="Award" />);
                case 'regular':
                default:
                  const service = state.settings.services.find(s => s.id === station.type);
                  if (!service) return null;
                  return getCallButton(station.type, `Call Next ${service.label}`, <Megaphone />);
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
