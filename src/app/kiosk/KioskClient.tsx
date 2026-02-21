
'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Ticket, Service, Settings } from "@/lib/types";
import { useState, useRef, useEffect, useMemo } from "react";
import { PrintableTicket } from "./PrintableTicket";
import { Icon } from "@/lib/icons";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, doc, runTransaction, Timestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";
import Image from "next/image";
import { Clock } from "@/app/display/Clock";

const KioskButton = ({ service, isPrinting, onClick }: { service: Service, isPrinting: string | null, onClick: (id: string) => void }) => (
    <div className="flex justify-center items-center">
        <div className="w-2/3 aspect-square">
            <Button
                variant="outline"
                className="w-full h-full flex flex-col items-center justify-center gap-6 rounded-2xl shadow-lg transform transition-transform hover:scale-105 border-primary text-primary hover:bg-primary/5 p-8 cursor-large-pointer whitespace-normal"
                onClick={() => onClick(service.id)}
                disabled={!!isPrinting}
            >
                {isPrinting === service.id ? (
                    <Loader2 className="h-16 w-16 animate-spin" />
                ) : (
                    <Icon name={service.icon} className="h-16 w-16" />
                )}
                <div className="flex flex-col text-center">
                    <span className="text-3xl font-semibold">
                    {isPrinting === service.id
                        ? 'Preparing Ticket...'
                        : !!isPrinting
                        ? 'Please wait...'
                        : service.label}
                    </span>
                    {!!isPrinting && isPrinting !== service.id && (
                        <span className="text-lg font-normal text-muted-foreground">Another request is in progress.</span>
                    )}
                </div>
            </Button>
        </div>
    </div>
);


const ButtonSkeleton = () => (
    <div className="w-full flex justify-center items-center">
        <div className="w-2/3 aspect-square bg-muted rounded-2xl animate-pulse" />
    </div>
);


export function KioskClient() {
  const { firestore } = useFirebase();
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, "settings", "app") : null), [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);
  const { toast } = useToast();
  const [ticketToPrint, setTicketToPrint] = useState<Ticket | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState<string | null>(null);
  
  const ticketsCollection = useMemo(() => (firestore ? collection(firestore, 'tickets') : null), [firestore]);

  const services = useMemo(() => settings?.services || [], [settings]);
  const midPoint = Math.ceil(services.length / 2);
  const leftServices = useMemo(() => services.slice(0, midPoint), [services, midPoint]);
  const rightServices = useMemo(() => services.slice(midPoint), [services, midPoint]);

  useEffect(() => {
    if (ticketToPrint) {
      const service = settings?.services?.find(s => s.id === ticketToPrint.type);
      toast({
          title: `Printing Ticket ${ticketToPrint.ticketNumber}`,
          description: `Your ticket for ${service?.label || 'a service'} is printing.`,
          duration: 5000,
      });

      const timer = setTimeout(() => {
        window.print();
        setTicketToPrint(null);
        setIsPrinting(null);
      }, 100); 

      return () => clearTimeout(timer);
    }
  }, [ticketToPrint, settings, toast]);
  
  const handleGetTicket = async (type: string) => {
    if (!firestore || !ticketsCollection || isPrinting) return;
  
    setIsPrinting(type);
    let newTicketPayload: Omit<Ticket, 'id'> | null = null;
    let newTicketId: string | null = null;

    try {
        const newTicket = await runTransaction(firestore, async (transaction) => {
            const service = settings?.services?.find(s => s.id === type);
            if (!service) {
                throw new Error(`Service with type '${type}' not found.`);
            }

            const counterRef = doc(firestore, "counters", "main-queue");
            const newTicketRef = doc(ticketsCollection);
            newTicketId = newTicketRef.id;

            const counterDoc = await transaction.get(counterRef);

            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            let newNumber = 1;
            if (counterDoc.exists()) {
                const counterData = counterDoc.data();
                const lastResetDate = counterData.lastReset.toDate();
                if (lastResetDate < startOfToday) {
                    newNumber = 1;
                } else {
                    newNumber = counterData.count + 1;
                }
            }
            
            transaction.set(counterRef, { count: newNumber, lastReset: Timestamp.now() }, { merge: true });

            const ticketNumber = newNumber.toString();

            const finalTicketPayload = {
                ticketNumber,
                type,
                status: 'waiting' as const,
                createdAt: Timestamp.now(),
            };
            newTicketPayload = finalTicketPayload;

            transaction.set(newTicketRef, finalTicketPayload);
            
            return {
                id: newTicketRef.id,
                ...finalTicketPayload,
            };
        });

        setTicketToPrint(newTicket as Ticket);

    } catch (error: any) {
        setIsPrinting(null);
        
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

  const logoUrl = settings?.companyLogoUrl?.trim();
  const isLogoValid = logoUrl && (logoUrl.startsWith('/') || logoUrl.startsWith('http'));

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-7xl flex-shrink-0 text-center">
        {isLogoValid ? (
            <div className="flex justify-center mb-2">
                <Image
                    src={encodeURI(logoUrl)}
                    alt={`${settings?.companyName || 'Company'} Logo`}
                    width={180}
                    height={60}
                    className="h-16 w-auto object-contain"
                    priority
                />
            </div>
        ) : (
            <div className="flex justify-center mb-2 h-16 items-center" />
        )}
        {settings?.companyName && (
            <h1 className="text-3xl font-bold tracking-tight">{settings.companyName}</h1>
        )}
        <p className="text-muted-foreground mt-2 mb-4">
          Please select a service to get your ticket.
        </p>
        <div className="text-muted-foreground text-lg max-w-md mx-auto">
          <Clock />
        </div>
      </div>

      <div className="flex-grow flex w-full items-center justify-center">
        <div className="grid w-full max-w-4xl grid-cols-1 md:grid-cols-2 items-center justify-center gap-8 p-4">
           {/* Left Column */}
          <div className="flex flex-col items-center justify-center gap-8">
            {isLoadingSettings ? (
              <>
                <ButtonSkeleton />
                <ButtonSkeleton />
              </>
            ) : (
              leftServices.map(service => (
                <KioskButton key={service.id} service={service} isPrinting={isPrinting} onClick={handleGetTicket} />
              ))
            )}
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col items-center justify-center gap-8">
            {isLoadingSettings ? (
              <>
                <ButtonSkeleton />
                <ButtonSkeleton />
              </>
            ) : (
              rightServices.map(service => (
                <KioskButton key={service.id} service={service} isPrinting={isPrinting} onClick={handleGetTicket} />
              ))
            )}
          </div>

          {/* No services available message */}
          {!isLoadingSettings && services.length === 0 && (
            <div className="md:col-span-2 text-center text-muted-foreground flex items-center justify-center">
                <div className="flex flex-col items-center">
                <p className="text-lg font-semibold">No Services Available</p>
                <p>
                    This kiosk is not yet configured. Please contact an administrator.
                </p>
                </div>
            </div>
          )}
        </div>
      </div>
      <div className="printable-area">
        <PrintableTicket ref={printableRef} ticket={ticketToPrint} companyName={settings?.companyName || ''} service={getPrintableService(ticketToPrint)} companyLogoUrl={logoUrl} />
      </div>
    </div>
  );
}

    