'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Ticket, Service, Settings } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { PrintableTicket } from "./PrintableTicket";
import { Icon } from "@/lib/icons";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, doc, runTransaction, Timestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";

export function KioskClient() {
  const { firestore, user, isUserLoading } = useFirebase();
  const settingsRef = useMemoFirebase(() => (firestore && user ? doc(firestore, "settings", "app") : null), [firestore, user]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);
  const { toast } = useToast();
  const [ticketToPrint, setTicketToPrint] = useState<Ticket | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState<string | null>(null);
  
  const ticketsCollection = useMemoFirebase(() => (firestore && user ? collection(firestore, 'tickets') : null), [firestore, user]);


  useEffect(() => {
    if (ticketToPrint) {
      const service = settings?.services?.find(s => s.id === ticketToPrint.type);
      toast({
          title: `Printing Ticket ${ticketToPrint.ticketNumber}`,
          description: `Your ticket for ${service?.label || 'a service'} is printing.`,
          duration: 5000,
      });

      // A brief delay to allow React to re-render the printable component with the new ticket data
      // before the browser's print dialog is opened.
      const timer = setTimeout(() => {
        window.print();
        setTicketToPrint(null); // Reset after triggering print
        setIsPrinting(null);
      }, 100); // 100ms is usually sufficient for the DOM to update.

      return () => clearTimeout(timer); // Cleanup the timer if the component unmounts
    }
  }, [ticketToPrint, settings, toast]);
  
  const handleGetTicket = async (type: string) => {
    if (!firestore || !ticketsCollection || isPrinting || isUserLoading) return;
  
    setIsPrinting(type);
    let newTicketPayload: Omit<Ticket, 'id'> | null = null;
    let newTicketId: string | null = null;

    try {
        const newTicket = await runTransaction(firestore, async (transaction) => {
            const service = settings?.services?.find(s => s.id === type);
            if (!service) {
                throw new Error(`Service with type '${type}' not found.`);
            }

            // Use a single, global counter for all tickets.
            const counterRef = doc(firestore, "counters", "main-queue");
            const newTicketRef = doc(ticketsCollection);
            newTicketId = newTicketRef.id;

            const counterDoc = await transaction.get(counterRef);

            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            let newNumber = 1;
            // Check if counter exists and if it was reset today
            if (counterDoc.exists()) {
                const counterData = counterDoc.data();
                const lastResetDate = counterData.lastReset.toDate();
                if (lastResetDate < startOfToday) {
                    // It's a new day, reset the counter
                    newNumber = 1;
                } else {
                    // It's the same day, increment
                    newNumber = counterData.count + 1;
                }
            }
            
            // Update the counter atomically
            transaction.set(counterRef, { count: newNumber, lastReset: Timestamp.now() }, { merge: true });

            const ticketNumber = newNumber.toString();

            const finalTicketPayload = {
                ticketNumber,
                type,
                status: 'waiting' as const,
                createdAt: Timestamp.now(),
            };
            newTicketPayload = finalTicketPayload; // Capture for potential error reporting

            // Create the new ticket atomically
            transaction.set(newTicketRef, finalTicketPayload);
            
            // Return the complete ticket object for the UI
            return {
                id: newTicketRef.id,
                ...finalTicketPayload,
            };
        });

        // If transaction is successful, trigger the print
        setTicketToPrint(newTicket as Ticket);

    } catch (error: any) {
        setIsPrinting(null); // Stop loading indicator on failure
        
        if (error.code === 'unavailable' || error.code === 'network-request-failed') {
             toast({
                variant: "destructive",
                title: "CRITICAL: Connection Blocked by Firewall",
                description: "The application cannot connect to the local database because your PC's firewall is blocking it. This is a system configuration issue, not an application bug. Please allow the app through your firewall.",
                duration: 20000,
            });
        } else if (error.code === 'permission-denied' && ticketsCollection && newTicketId) {
             const permissionError = new FirestorePermissionError({
                path: `tickets/${newTicketId}`,
                operation: 'create',
                requestResourceData: newTicketPayload,
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            toast({
                variant: "destructive",
                title: "Could not get ticket",
                description: error.message || "An unexpected error occurred. Please try again.",
            });
        }
    }
  };

  const getPrintableService = (ticket: Ticket | null): Service | undefined => {
      if (!ticket) return undefined;
      return settings?.services?.find(s => s.id === ticket.type);
  }

  const isHydrated = !isLoadingSettings && !isUserLoading;

  return (
    <>
      <div className="flex justify-center">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground">Get Your Ticket</h2>
              <p className="text-muted-foreground mt-2">
                Please select a service.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {!isHydrated ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
                ))
              ) : settings?.services && settings.services.length > 0 ? (
                settings.services.map((service) => (
                  <Button
                    key={service.id}
                    variant="outline"
                    className="h-auto text-xl flex-col gap-2 rounded-lg shadow-lg transform transition-transform hover:scale-105 border-primary text-primary hover:bg-primary/5 whitespace-normal py-4"
                    onClick={() => handleGetTicket(service.id)}
                    disabled={!isHydrated || !!isPrinting}
                  >
                    {isPrinting === service.id ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                        <Icon name={service.icon} className="h-8 w-8" />
                    )}
                    <div className="flex flex-col">
                        <span className="font-semibold text-2xl">
                          {isPrinting === service.id
                            ? 'Preparing Ticket...'
                            : !!isPrinting
                            ? 'Please wait...'
                            : service.label}
                        </span>
                        {!!isPrinting && isPrinting !== service.id && (
                           <span className="text-sm font-normal text-muted-foreground">Another request is in progress.</span>
                        )}
                    </div>
                  </Button>
                ))
              ) : (
                <div className="sm:col-span-2 text-center text-muted-foreground py-10">
                  <p className="text-lg font-semibold">No Services Available</p>
                  <p>
                    This kiosk is not yet configured. Please contact an administrator.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="printable-area">
        <PrintableTicket ref={printableRef} ticket={ticketToPrint} companyName={settings?.companyName || ''} service={getPrintableService(ticketToPrint)} />
      </div>
    </>
  );
}
