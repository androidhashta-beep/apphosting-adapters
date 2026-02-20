'use client';

import type { TicketType, Ticket, Settings, Station } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Megaphone, Check, SkipForward, Ban, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/lib/icons";
import { useFirebase, updateDocumentNonBlocking, useDoc, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export function StationControlCard({ 
  station,
  ticket,
  waitingCounts,
}: { 
  station: Station;
  ticket: Ticket | undefined;
  waitingCounts: { [key: string]: number };
}) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, "settings", "app") : null), [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const servicesForStation = useMemo(() => {
    if (isLoadingSettings || !station.serviceIds || station.serviceIds.length === 0 || !settings?.services) {
      return [];
    }
    return settings.services.filter(s => (station.serviceIds || []).includes(s.id));
  }, [isLoadingSettings, station.serviceIds, settings?.services]);
  
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
    if (typeof window === 'undefined' || !window.speechSynthesis || !settings) return;
    
    window.speechSynthesis.cancel();

    const service = settings.services?.find(s => s.id === ticketType);
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
  }, [voices, settings]);

  useEffect(() => {
    if (ticket && ticket.status === 'serving' && ticket.calledAt && (Timestamp.now().toMillis() - ticket.calledAt.toMillis() < 5000)) {
      announce(ticket.ticketNumber, station.name, ticket.type);
    }
  }, [ticket?.id, ticket?.calledAt, announce, ticket, station.name]);

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
    if (ticket && firestore) {
      const stationRef = doc(firestore, 'stations', station.id);
      const ticketRef = doc(firestore, 'tickets', ticket.id);
      updateDocumentNonBlocking(stationRef, { currentTicketId: null });
      updateDocumentNonBlocking(ticketRef, { status: 'served', servedAt: Timestamp.now() });
    }
  };

  const skipTicket = () => {
    if (ticket && firestore) {
      const stationRef = doc(firestore, 'stations', station.id);
      const ticketRef = doc(firestore, 'tickets', ticket.id);
      updateDocumentNonBlocking(stationRef, { currentTicketId: null });
      updateDocumentNonBlocking(ticketRef, { status: 'skipped' });
    }
  };

  const callNext = async (ticketType: TicketType) => {
    if (!firestore || station.status === 'closed' || station.currentTicketId) {
      return;
    }

    try {
        const ticketsCollection = collection(firestore, "tickets");
        const q = query(
        ticketsCollection,
        where("type", "==", ticketType),
        where("status", "==", "waiting"),
        orderBy("createdAt"),
        limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const nextTicket = querySnapshot.docs[0];
            const stationRef = doc(firestore, 'stations', station.id);
            const ticketRef = doc(firestore, 'tickets', nextTicket.id);
            
            updateDocumentNonBlocking(stationRef, { currentTicketId: nextTicket.id });
            updateDocumentNonBlocking(ticketRef, { status: 'serving', servedBy: station.id, calledAt: Timestamp.now() });
        } else {
            toast({
                variant: "default",
                title: "Queue is empty",
                description: `There are no more tickets waiting for this service.`,
            });
        }
    } catch (error: any) {
        if (error.code === 'unavailable' || error.code === 'network-request-failed') {
             toast({
                variant: "destructive",
                title: "CRITICAL: Connection Blocked by Firewall",
                description: "The application cannot connect to the local database because your PC's firewall is blocking it. This is a system configuration issue, not an application bug. Please allow the app through your firewall.",
                duration: 20000,
            });
        } else {
            console.error("Error calling next ticket:", error);
            toast({
                variant: "destructive",
                title: "Could not call ticket",
                description: error.message || "An unexpected error occurred. Please try again.",
            });
        }
    }
  };

  const handleStatusChange = (checked: boolean) => {
    if (firestore) {
      const stationRef = doc(firestore, 'stations', station.id);
      const newStatus = checked ? 'open' : 'closed';
      
      if (newStatus === 'closed' && station.currentTicketId && ticket) {
        const ticketRef = doc(firestore, 'tickets', ticket.id);
        updateDocumentNonBlocking(ticketRef, { status: 'waiting', servedBy: null, calledAt: null });
        updateDocumentNonBlocking(stationRef, { status: newStatus, currentTicketId: null });
      } else {
        updateDocumentNonBlocking(stationRef, { status: newStatus });
      }
    }
  };

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
          <div className="w-full space-y-2">
            {isClosed ? (
              <Button variant="ghost" className="w-full text-muted-foreground" disabled>
                  <Ban /> Station is closed
              </Button>
            ) : servicesForStation.length > 0 ? (
                servicesForStation.map(service => {
                    const waitingCount = waitingCounts[service.id] || 0;
                    const isQueueEmpty = waitingCount === 0;
                    const isDisabled = isClosed || !!station.currentTicketId;

                    return (
                        <Button key={service.id} onClick={() => callNext(service.id)} className="w-full justify-between" disabled={isDisabled}>
                            <div className="flex items-center gap-2">
                                <Icon name={service.icon} />
                                <span>{`Call ${service.label}`}</span>
                            </div>
                            <span className={cn(
                                "text-primary-foreground rounded-full px-2 text-xs",
                                isQueueEmpty ? "bg-primary-foreground/20" : "bg-primary-foreground/40 font-bold"
                            )}>{waitingCount}</span>
                        </Button>
                    );
                })
            ) : (
              <p className="text-sm text-center text-muted-foreground p-4">No services assigned.</p>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
