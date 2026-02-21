
"use client";

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

export function NowServing({ servingData }: { servingData: ServingData[] }) {
  
  return (
    <div className="h-full flex flex-col">
        {/* Main Header */}
        <div className="grid grid-cols-[1fr,auto,auto] gap-x-2 px-4 pt-2 pb-1 border-b-2 border-white/50 flex-shrink-0">
            <h2 className="text-xl font-bold text-left justify-self-start">Service</h2>
            <h2 className="text-xl font-bold text-center min-w-[7rem]">Ticket</h2>
            <h2 className="text-xl font-bold text-center min-w-[7rem]">Counter</h2>
        </div>

        {/* Scrollable content area */}
        <ScrollArea className="flex-grow">
            {/* Serving List */}
            {servingData.length > 0 ? (
                <ul className="flex flex-col">
                {servingData.map((item) => (
                    <li
                    key={`${item.stationName}-${item.ticketNumber}`}
                    className={cn(
                        "grid grid-cols-[1fr,auto,auto] items-center gap-x-2 px-4 py-2 text-3xl font-extrabold border-b border-white/20",
                    )}
                    >
                    <span className="text-left justify-self-start text-2xl">{abbreviateService(item.serviceLabel)}</span>
                    <div className="flex flex-col items-center justify-center text-center min-w-[7rem]">
                        <span className="leading-none">{item.ticketNumber}</span>
                    </div>
                    <span className="text-center min-w-[7rem]">{item.stationName.replace('Window ', '')}</span>
                    </li>
                ))}
                </ul>
            ) : (
                 <div className="flex h-full items-center justify-center text-center text-slate-300">
                    <p className="text-lg">Other serving tickets will appear here.</p>
                </div>
            )}
        </ScrollArea>
    </div>
  );
}
