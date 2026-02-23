'use client';

import type { Ticket, Settings, Station } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Megaphone, Check, SkipForward, Ban, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebase, updateDocumentNonBlocking, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


// Generic error handler for this component
const handleFirestoreError = (error: any, toast: any, operation: string) => {
    if (error.code === 'unavailable' || error.code === 'network-request-failed') {
        toast({
            variant: "destructive",
            title: "CRITICAL: Connection Blocked by Firewall",
            description: `The '${operation}' operation failed because your PC's firewall is blocking the connection. Please allow the app through your firewall.`,
            duration: 20000,
        });
    } else {
        toast({
            variant: "destructive",
            title: `Could not ${operation}`,
            description: error.message || "An unexpected error occurred. Please try again.",
        });
    }
};


export function StationControlCard({ 
  station,
  ticket,
  allTickets,
  waitingCounts,
}: { 
  station: Station;
  ticket: Ticket | undefined;
  allTickets: Ticket[];
  waitingCounts: { [key: string]: number };
}) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, "settings", "app") : null), [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);

  const servicesForStation = useMemo(() => {
    if (isLoadingSettings || !station.serviceIds || station.serviceIds.length === 0 || !settings?.services) {
      return [];
    }
    return settings.services.filter(s => (station.serviceIds || []).includes(s.id));
  }, [isLoadingSettings, station.serviceIds, settings?.services]);

  const totalWaitingForStation = useMemo(() => {
    if (!station.serviceIds) return 0;
    return station.serviceIds.reduce((total, serviceId) => {
      return total + (waitingCounts[serviceId] || 0);
    }, 0);
  }, [station.serviceIds, waitingCounts]);

  if (!station) {
    return <Skeleton className="h-[480px] rounded-lg" />;
  }
  
  const isClosed = station.status === 'closed';

  const callAgain = () => {
    if (ticket && firestore) {
      const ticketRef = doc(firestore, 'tickets', ticket.id);
      updateDocumentNonBlocking(ticketRef, { calledAt: Timestamp.now() });
      toast({
        title: 'Re-announcing Ticket',
        description: `Ticket ${ticket.ticketNumber} is being announced again on the public display.`,
      });
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

  const callNext = async () => {
    if (!firestore || station.status === 'closed' || station.currentTicketId || !station.serviceIds || station.serviceIds.length === 0) {
      return;
    }

    try {
      const waitingTicketsForStation = allTickets
        .filter(t => t.status === 'waiting' && station.serviceIds?.includes(t.type))
        .sort((a, b) => {
            const timeA = a.createdAt as Timestamp;
            const timeB = b.createdAt as Timestamp;
            return timeA.toMillis() - timeB.toMillis();
        });

      if (waitingTicketsForStation.length > 0) {
        const nextTicket = waitingTicketsForStation[0];
        const stationRef = doc(firestore, 'stations', station.id);
        const ticketRef = doc(firestore, 'tickets', nextTicket.id);

        // Not atomic, but less likely to cause a server crash.
        await updateDoc(stationRef, { currentTicketId: nextTicket.id });
        await updateDoc(ticketRef, { status: 'serving', servedBy: station.id, calledAt: Timestamp.now() });

      } else {
        toast({
            variant: "default",
            title: "Queue is empty",
            description: `There are no waiting customers for the services offered at this station.`,
        });
      }
    } catch (error: any) {
        handleFirestoreError(error, toast, 'call next ticket');
    }
  };

  const handleStatusChange = async (checked: boolean) => {
    if (!firestore) return;

    const stationRef = doc(firestore, 'stations', station.id);
    const newStatus = checked ? 'open' : 'closed';
    
    try {
      if (newStatus === 'closed' && station.currentTicketId && ticket) {
        // Return ticket to queue, then close station. Not atomic.
        const ticketRef = doc(firestore, 'tickets', ticket.id);
        await updateDoc(ticketRef, { status: 'waiting', servedBy: null, calledAt: null });
        await updateDoc(stationRef, { status: newStatus, currentTicketId: null });
      } else {
        // Just open/close the station if it's empty
        await updateDoc(stationRef, { status: newStatus });
      }
    } catch (error: any) {
      handleFirestoreError(error, toast, 'change station status');
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
                <Button onClick={callNext} className="w-full justify-between" disabled={isClosed || !!station.currentTicketId}>
                    <div className="flex items-center gap-2">
                        <Megaphone />
                        <span>Call Next Customer</span>
                    </div>
                    <span className={cn(
                        "text-primary-foreground rounded-full px-2 text-xs",
                        totalWaitingForStation === 0 ? "bg-primary-foreground/20" : "bg-primary-foreground/40 font-bold"
                    )}>{totalWaitingForStation}</span>
                </Button>
            ) : (
              <p className="text-sm text-center text-muted-foreground p-4">No services assigned.</p>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
