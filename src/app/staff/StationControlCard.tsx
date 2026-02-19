"use client";

import { useQueue } from "@/contexts/QueueProvider";
import type { Station, StationStatus, TicketType } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Volume2, Check, SkipForward, Ban, Loader2, Award, User, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";


export function StationControlCard({ station }: { station: Station }) {
  const { dispatch, getTicketByStation, getWaitingTickets } = useQueue();
  const ticket = getTicketByStation(station.id);
  const isClosed = station.status === 'closed';

  const [isRecalling, setIsRecalling] = useState(false);
  const { toast } = useToast();

  const selectVoice = (serviceType: TicketType, allVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    if (allVoices.length === 0) return undefined;

    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (serviceType === 'enrollment') {
        // Prefer female voices for registrar
        selectedVoice = allVoices.find(v => v.gender === 'female') || allVoices.find(v => v.name.toLowerCase().includes('female'));
    } else {
        // Prefer male voices for cashier and certificate
        selectedVoice = allVoices.find(v => v.gender === 'male') || allVoices.find(v => v.name.toLowerCase().includes('male'));
    }
    
    // Fallback if a gender-specific voice wasn't found
    if (!selectedVoice) {
        if (serviceType !== 'enrollment') {
          // For male, try any non-female voice as a fallback
          selectedVoice = allVoices.find(v => v.gender !== 'female' && !v.name.toLowerCase().includes('female'));
        }
        // If still no voice, or for enrollment, just pick the default system voice
        if (!selectedVoice) {
          selectedVoice = allVoices[0];
        }
    }
    return selectedVoice;
  };


  const playAnnouncement = (text: string, serviceType: TicketType, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      toast({
        variant: "destructive",
        title: "Audio Callout Not Supported",
        description: "Your browser does not support speech synthesis.",
      });
      onEnd?.();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const allVoices = window.speechSynthesis.getVoices();

      // If voices are available, select one. Otherwise, the browser uses the default.
      if (allVoices.length > 0) {
        utterance.voice = selectVoice(serviceType, allVoices);
      }
      
      utterance.onend = () => {
        onEnd?.();
      };
      
      utterance.onerror = () => {
          toast({
              variant: "destructive",
              title: "Audio Callout Failed",
              description: "An error occurred during speech synthesis.",
          });
          onEnd?.();
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Audio Callout Failed",
            description: "Could not initiate speech synthesis.",
        });
        onEnd?.();
    }
  };

  const handleStatusChange = (checked: boolean) => {
    const newStatus: StationStatus = checked ? 'open' : 'closed';
    dispatch({ type: 'UPDATE_STATION_STATUS', payload: { stationId: station.id, status: newStatus } });
  };

  const callNext = (ticketType: TicketType) => {
    const waitingTickets = getWaitingTickets(ticketType);
    const nextTicket = waitingTickets[0];
    if (!nextTicket) {
      toast({
        variant: "destructive",
        title: "No Tickets Waiting",
        description: `There are no students in the ${ticketType} queue.`,
      });
      return;
    }
      
    dispatch({ type: 'CALL_NEXT_TICKET', payload: { stationId: station.id, ticketType } });

    const ticketNumber = nextTicket.ticketNumber;
    const destination = station.name;
    const serviceType = nextTicket.type;
    const textToSay = `Customer number ${ticketNumber} for ${serviceType}, please go to ${destination}.`;

    playAnnouncement(textToSay, serviceType);
  };

  const handleCallAgain = () => {
    if (!ticket) return;

    setIsRecalling(true);
    
    const ticketNumber = ticket.ticketNumber;
    const destination = station.name;
    const serviceType = ticket.type;
    const textToSay = `Customer number ${ticketNumber} for ${serviceType}, please go to ${destination}.`;
    
    playAnnouncement(textToSay, serviceType, () => {
      setIsRecalling(false);
    });
  };

  useEffect(() => {
    // Pre-load voices when component mounts.
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);


  const completeTicket = () => {
    dispatch({ type: 'COMPLETE_TICKET', payload: { stationId: station.id } });
  };

  const skipTicket = () => {
    dispatch({ type: 'SKIP_TICKET', payload: { stationId: station.id } });
  };

  const getCallButton = (type: TicketType, label: string, icon: React.ReactNode) => {
    const waitingCount = getWaitingTickets(type).length;
    return (
        <Button onClick={() => callNext(type)} className="w-full justify-between" disabled={isClosed || waitingCount === 0}>
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
            <Button onClick={completeTicket} className="w-full bg-green-600 hover:bg-green-700">
              <Check /> Complete Service
            </Button>
            <Button onClick={handleCallAgain} variant="outline" className="w-full" disabled={isRecalling}>
                {isRecalling ? <Loader2 className="animate-spin" /> : <Volume2 />}
                Call Again
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
                  return getCallButton(station.type, `Call Next ${station.type}`, <Volume2 />);
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
