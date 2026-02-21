"use client";

import type { Service, Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type ServingData = {
  stationName: string;
  ticketNumber: string;
  serviceLabel: string;
  calledAt: any;
};

// Function to abbreviate service names
function abbreviateService(label: string): string {
    const serviceLabelLower = label.toLowerCase();
    
    if (serviceLabelLower.includes('payment') || serviceLabelLower.includes('cashier')) return 'PAYMENT';
    if (serviceLabelLower.includes('registrar')) return 'REGISTRAR';
    if (serviceLabelLower.includes('certificate')) return 'CERTIFICATE';
    if (serviceLabelLower.includes('information') || serviceLabelLower.includes('inquiry')) return 'INQUIRY';
    
    // Fallback for other service names that might exist from DB
    const words = label.toUpperCase().split(' ');
    if (words.length > 1) {
        return words.map(word => word.substring(0, 3)).join('/');
    }
    return label.substring(0, 10).toUpperCase();
}


export function NowServing({ servingData, waitingData, services }: { servingData: ServingData[], waitingData: Ticket[], services: Service[] }) {
  
  const waitingList = (waitingData || []).map(ticket => ({
      ticketNumber: ticket.ticketNumber,
      serviceLabel: services.find(s => s.id === ticket.type)?.label || '...',
      id: ticket.id
  }));

  return (
    <div className="w-1/2 h-full flex flex-col p-4">
      <div className="grid grid-cols-[1fr,auto,auto] gap-x-8 px-6 pb-2 border-b-2 border-white/50 flex-shrink-0">
        <h2 className="text-3xl font-bold text-left justify-self-start">Services</h2>
        <h2 className="text-3xl font-bold text-center min-w-[12rem]">Queue No.</h2>
        <h2 className="text-3xl font-bold text-center min-w-[12rem]">Counter</h2>
      </div>
      <ScrollArea className="flex-grow">
        {/* Serving List */}
        <ul className="flex flex-col">
          {servingData.map((item) => (
            <li
              key={`${item.stationName}-${item.ticketNumber}`}
              className={cn(
                "grid grid-cols-[1fr,auto,auto] items-center gap-x-8 px-6 py-3 text-5xl font-extrabold border-b border-white/20 transition-all duration-500",
                "bg-yellow-400 text-blue-900 animate-pulse-slow"
              )}
            >
              <span className="text-left justify-self-start">{abbreviateService(item.serviceLabel)}</span>
              <div className="flex flex-col items-center justify-center text-center min-w-[12rem]">
                <span className="leading-none">{item.ticketNumber}</span>
              </div>
              <span className="text-center min-w-[12rem]">{item.stationName.replace('Window ', '')}</span>
            </li>
          ))}
        </ul>
        
        {/* Waiting List */}
        {waitingList.length > 0 && (
          <div className="mt-4 pt-4 border-t-2 border-white/30">
            <h3 className="text-2xl font-bold text-center mb-2 text-white/90">WAITING</h3>
            <ul className="flex flex-col">
              {waitingList.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[1fr,auto,auto] items-center gap-x-8 px-6 py-2 text-4xl font-bold border-b border-white/10 bg-orange-300 text-black/80"
                >
                  <span className="text-left justify-self-start">{abbreviateService(item.serviceLabel)}</span>
                  <div className="flex flex-col items-center justify-center text-center min-w-[12rem]">
                      <span className="leading-none">{item.ticketNumber}</span>
                  </div>
                  <span className="text-center min-w-[12rem] font-normal">-</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
