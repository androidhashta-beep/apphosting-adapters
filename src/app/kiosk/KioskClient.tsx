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
  const {data: tickets, isLoading: isLoadingTickets} = useCollection<Ticket>(ticketsCollection);


  useEffect(() => {
    if (ticketToPrint) {
      window.print();
      setTicketToPrint(null); // Reset after triggering print
    }
  }, [ticketToPrint]);
  
  const handleGetTicket = async (type: string) => {
    if (!firestore || !ticketsCollection) return;
  
    // Determine the ticket number
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDayTimestamp = Timestamp.fromDate(startOfDay);
  
    const q = query(
      ticketsCollection,
      where("createdAt", ">=", startOfDayTimestamp),
      orderBy("createdAt", "desc"),
      limit(1)
    );
  
    const querySnapshot = await getDocs(q);
    let newNumber = 1;
    if (!querySnapshot.empty) {
      const lastTicket = querySnapshot.docs[0].data();
      const lastTicketNumber = parseInt(lastTicket.ticketNumber, 10);
      newNumber = lastTicketNumber + 1;
    }
  
    const ticketNumber = `${newNumber}`;
  
    const newTicketData = {
      ticketNumber,
      type,
      status: 'waiting' as const,
      createdAt: Timestamp.now(),
    };
  
    const docRefPromise = addDocumentNonBlocking(ticketsCollection, newTicketData);
  
    docRefPromise.then(docRef => {
        const fullTicket: Ticket = {
            id: docRef.id,
            ...newTicketData,
        };
        setTicketToPrint(fullTicket);
        const service = settings?.services.find(s => s.id === type);
        toast({
            title: `Printing Ticket ${fullTicket.ticketNumber}`,
            description: `Your ticket for ${service?.label || 'a service'} is printing.`,
            duration: 5000,
        });
    });
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
