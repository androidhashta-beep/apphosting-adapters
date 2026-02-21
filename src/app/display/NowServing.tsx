"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type ServingData = {
  stationName: string;
  ticketNumber: string;
  serviceLabel: string;
  calledAt: any;
};

type WaitingData = {
    ticketNumber: string;
    serviceLabel: string;
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

export function NowServing({ servingData, waitingData }: { servingData: ServingData[], waitingData: WaitingData[] }) {
  
  return (
    <div className="w-1/2 h-full flex flex-col p-4">
      {/* Main Header */}
      <div className="grid grid-cols-[1fr,auto,auto] gap-x-8 px-6 pb-2 border-b-2 border-white/50 flex-shrink-0">
        <h2 className="text-3xl font-bold text-left justify-self-start">Services</h2>
        <h2 className="text-3xl font-bold text-center min-w-[12rem]">Queue No.</h2>
        <h2 className="text-3xl font-bold text-center min-w-[12rem]">Counter</h2>
      </div>

      {/* Scrollable content area */}
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
        
        {/* Waiting List Section */}
        {waitingData && waitingData.length > 0 && (
            <div className="mt-4">
                <div className="grid grid-cols-[1fr,auto] gap-x-8 px-6 pb-2 border-b-2 border-white/50">
                    <h2 className="text-xl font-bold text-left justify-self-start text-white/90">WAITING</h2>
                    <h2 className="text-xl font-bold text-center min-w-[12rem] text-white/90">QUEUE NO.</h2>
                </div>
                <ul className="flex flex-col">
                    {waitingData.map((item) => (
                        <li
                            key={item.ticketNumber}
                            className="grid grid-cols-[1fr,auto] items-center gap-x-8 px-6 py-2 text-4xl font-bold border-b border-white/20 bg-orange-300/80 text-blue-900"
                        >
                            <span className="text-left justify-self-start">{abbreviateService(item.serviceLabel)}</span>
                            <div className="flex flex-col items-center justify-center text-center min-w-[12rem]">
                                <span className="leading-none">{item.ticketNumber}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </ScrollArea>
    </div>
  );
}
