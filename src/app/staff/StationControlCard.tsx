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
import { useState, useRef, useEffect } from "react";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { useToast } from "@/hooks/use-toast";

const getServiceDescriptionForSpeech = (type: TicketType) => {
  switch (type) {
    case 'enrollment':
      return 'enrollment';
    case 'payment':
      return 'payment';
    case 'certificate':
      return 'certificate claiming';
    default:
      return 'service';
  }
};


export function StationControlCard({ station }: { station: Station }) {
  const { dispatch, getTicketByStation, getWaitingTickets } = useQueue();
  const ticket = getTicketByStation(station.id);
  const isClosed = station.status === 'closed';

  const [isCalling, setIsCalling] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleStatusChange = (checked: boolean) => {
    const newStatus: StationStatus = checked ? 'open' : 'closed';
    dispatch({ type: 'UPDATE_STATION_STATUS', payload: { stationId: station.id, status: newStatus } });
  };

  const callNext = async (ticketType: TicketType) => {
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
      
    setIsCalling(true);
    try {
        const ticketNumber = nextTicket.ticketNumber.split('-')[1];
        const serviceDescription = getServiceDescriptionForSpeech(nextTicket.type);
        const textToSay = `Customer number ${ticketNumber}, for ${serviceDescription}, go to ${station.name}.`;
        const { media } = await textToSpeech(textToSay);
        setAudioUrl(media);
    } catch (error: any) {
        console.error("Error generating TTS:", error);
        
        const isRateLimitError = error.message && (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429'));

        toast({
            variant: "destructive",
            title: "Audio Callout Failed",
            description: isRateLimitError
                ? "Audio announcement quota has been reached. Please wait a minute before trying again. The queue will continue without audio."
                : "Could not generate audio. The queue will continue without audio.",
        });
    } finally {
        dispatch({ type: 'CALL_NEXT_TICKET', payload: { stationId: station.id, ticketType } });
        setIsCalling(false);
    }
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
  }, [audioUrl]);


  const completeTicket = () => {
    dispatch({ type: 'COMPLETE_TICKET', payload: { stationId: station.id } });
  };

  const skipTicket = () => {
    dispatch({ type: 'SKIP_TICKET', payload: { stationId: station.id } });
  };

  const getCallButton = (type: TicketType, label: string, icon: React.ReactNode) => {
    const waitingCount = getWaitingTickets(type).length;
    return (
        <Button onClick={() => callNext(type)} className="w-full justify-between" disabled={isClosed || isCalling || waitingCount === 0}>
            <div className="flex items-center gap-2">
                {isCalling ? <Loader2 className="animate-spin" /> : icon}
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
            <Button onClick={skipTicket} variant="outline" className="w-full">
              <SkipForward /> Skip Ticket
            </Button>
          </>
        ) : (
          <>
            {station.mode === 'all-in-one' ? (
              <div className="w-full space-y-2">
                {getCallButton('enrollment', 'Call Enrollment', <User />)}
                {getCallButton('payment', 'Call Payment', <Ticket />)}
                {getCallButton('certificate', 'Call Certificate', <Award />)}
              </div>
            ) : (
                 getCallButton(station.type, `Call Next ${station.type}`, <Volume2 />)
            )}
            {!isClosed && (
              <Button variant="ghost" className="w-full text-muted-foreground" disabled>
                <Ban /> No ticket serving
              </Button>
            )}
          </>
        )}
      </CardFooter>
      {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setAudioUrl(null)}/>}
    </Card>
  );
}
