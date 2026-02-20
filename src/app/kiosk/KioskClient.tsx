'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Ticket, Service, Settings } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { PrintableTicket } from "./PrintableTicket";
import { Icon } from "@/lib/icons";
import { useCollection, useDoc, useFirebase, addDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, Timestamp, orderBy, limit, doc } from "firebase/firestore";

export function KioskClient() {
  const { firestore } = useFirebase();
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, "settings", "app") : null), [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);
  const { toast } = useToast();
  const [ticketToPrint, setTicketToPrint] = useState<Ticket | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);
  
  const ticketsCollection = useMemoFirebase(() => (firestore ? collection(firestore, 'tickets') : null), [firestore]);


  useEffect(() => {
    if (ticketToPrint) {
      window.print();
      setTicketToPrint(null); // Reset after triggering print
    }
  }, [ticketToPrint]);
  
  const handleGetTicket = async (type: string) => {
    if (!firestore || !ticketsCollection) return;
  
    try {
      // Determine the ticket number for the specific service
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfDayTimestamp = Timestamp.fromDate(startOfDay);

      const q = query(
        ticketsCollection,
        where("type", "==", type),
        where("createdAt", ">=", startOfDayTimestamp),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      let newNumber = 1;
      if (!querySnapshot.empty) {
        const lastTicket = querySnapshot.docs[0].data();
        // Robustly parse number part, e.g., from "ENROLL-001"
        const lastTicketNumberPart = lastTicket.ticketNumber?.split('-').pop() || '0';
        const lastTicketNumber = parseInt(lastTicketNumberPart, 10);
        newNumber = lastTicketNumber + 1;
      }

      const service = settings?.services.find(s => s.id === type);
      // Create a prefix, e.g., "ENRO" from "Enrollment"
      const servicePrefix = service?.label.substring(0, 4).toUpperCase().replace(/\s+/g, '') || "TKT";
      const ticketNumber = `${servicePrefix}-${newNumber.toString().padStart(3, '0')}`;

      const newTicketData = {
        ticketNumber,
        type,
        status: 'waiting' as const,
        createdAt: Timestamp.now(),
      };

      // Await the creation to ensure the next call to this function sees the new ticket
      const docRef = await addDocumentNonBlocking(ticketsCollection, newTicketData);

      if (docRef) {
          const fullTicket: Ticket = {
              id: docRef.id,
              ...newTicketData,
          };
          setTicketToPrint(fullTicket);
          toast({
              title: `Printing Ticket ${fullTicket.ticketNumber}`,
              description: `Your ticket for ${service?.label || 'a service'} is printing.`,
              duration: 5000,
          });
      }
    } catch (error: any) {
        if (error.code === 'unavailable') {
            console.error(
                `[Firebase Firestore] Network Connection Blocked when getting ticket.

                >>> FINAL DIAGNOSIS: PC FIREWALL OR SECURITY SOFTWARE <<<
                The application code is correct, but your PC's security is preventing it from connecting to the local server. This is the final step to resolve the issue.

                >>> ACTION REQUIRED ON YOUR PC <<<
                1. Open your PC's firewall settings (e.g., search for 'Windows Defender Firewall').
                2. Find the setting to 'Allow an app through firewall'.
                3. Add your application's .exe file to the list of allowed apps. It is located in the 'out/make' folder inside your project.

                This is a manual, one-time configuration on your computer. The application code cannot be changed further to fix this.`
            );
        } else {
            console.error("Error getting ticket:", error);
        }
        toast({
            variant: "destructive",
            title: "Could not get ticket",
            description: "Failed to connect to the server. Please check the connection and try again.",
        });
    }
  };

  const getPrintableService = (ticket: Ticket | null): Service | undefined => {
      if (!ticket) return undefined;
      return settings?.services.find(s => s.id === ticket.type);
  }

  const isHydrated = !isLoadingSettings;

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
              {!isHydrated ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
                ))
              ) : settings?.services && settings.services.length > 0 ? (
                settings.services.map((service) => (
                  <Button
                    key={service.id}
                    variant="outline"
                    className="h-auto min-h-40 text-xl flex-col gap-2 rounded-lg shadow-lg transform transition-transform hover:scale-105 border-primary text-primary hover:bg-primary/5 whitespace-normal py-4"
                    onClick={() => handleGetTicket(service.id)}
                    disabled={!isHydrated}
                  >
                    <Icon name={service.icon} className="h-8 w-8" />
                    <span>{service.label}</span>
                    <p className="text-sm font-normal normal-case text-muted-foreground mt-1 px-2">
                      {service.description}
                    </p>
                  </Button>
                ))
              ) : (
                <div className="md:col-span-3 text-center text-muted-foreground py-10">
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
