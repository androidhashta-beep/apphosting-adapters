"use client";

import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

type ServingData = {
  stationName: string;
  ticketNumber: string;
  serviceLabel: string;
};

// Function to abbreviate service names
function abbreviateService(label: string): string {
    const words = label.toUpperCase().split(' ');
    if (words.length > 1) {
        return words.map(word => word.substring(0, 3)).join('/');
    }
    return label.substring(0, 10).toUpperCase();
}


export function NowServing({ servingData, services }: { servingData: ServingData[], services: Service[] }) {
  
  const getServiceAbbreviation = (label: string) => {
    const serviceLabelLower = label.toLowerCase();
    
    if (serviceLabelLower.includes('payment') || serviceLabelLower.includes('cashier')) return 'PAYMENT';
    if (serviceLabelLower.includes('registrar')) return 'REGISTRAR';
    if (serviceLabelLower.includes('certificate')) return 'CERTIFICATE';
    if (serviceLabelLower.includes('information') || serviceLabelLower.includes('inquiry')) return 'INQUIRY';
    
    // Fallback for other service names that might exist from DB
    return abbreviateService(label);
  };
    
  return (
    <div className="w-2/3 h-full p-4 flex flex-col">
      <div className="grid grid-cols-[1fr,auto,auto] gap-x-8 px-6 pb-2 border-b-2 border-white/50">
        <h2 className="text-3xl font-bold">Services</h2>
        <h2 className="text-3xl font-bold text-center min-w-[12rem]">Queue No.</h2>
        <h2 className="text-3xl font-bold text-center min-w-[12rem]">Counter</h2>
      </div>
      <div className="flex-grow overflow-hidden">
        <ul className="h-full flex flex-col">
          {servingData.map((item, index) => (
            <li
              key={`${item.stationName}-${item.ticketNumber}`}
              className={cn(
                "grid grid-cols-[1fr,auto,auto] items-center gap-x-8 px-6 py-3 text-5xl font-extrabold border-b border-white/20 transition-all duration-500",
                index === 0 ? "bg-yellow-400 text-blue-900 animate-pulse-slow" : "text-white"
              )}
            >
              <span className={cn(index > 0 ? "text-blue-300" : "")}>{getServiceAbbreviation(item.serviceLabel)}</span>
              <div className="flex flex-col items-center justify-center text-center min-w-[12rem]">
                <span className="leading-none">{item.ticketNumber}</span>
                { index > 0 && <div className="h-1 w-16 bg-white/50 mt-1"></div> }
              </div>
              <span className="text-center min-w-[12rem]">{item.stationName.replace('Window ', '')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
