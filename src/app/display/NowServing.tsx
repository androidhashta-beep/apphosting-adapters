'use client';

import type { Service } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    const service = services.find(s => s.label === label);
    if (!service) return abbreviateService(label);
    
    if (service.label.toLowerCase().includes('payment')) return 'PAYMENT';
    if (service.label.toLowerCase().includes('registration')) return 'NEW CON';
    if (service.label.toLowerCase().includes('information')) return 'INQUIRY';
    return abbreviateService(service.label);
  };
    
  return (
    <div className="w-2/3 h-full bg-gradient-to-b from-sky-400 to-sky-600 p-4 flex flex-col">
      <div className="grid grid-cols-[1fr,auto,auto] gap-x-8 px-6 pb-2 border-b-2 border-white/50">
        <h2 className="text-3xl font-bold">Services</h2>
        <h2 className="text-3xl font-bold">Queue No.</h2>
        <h2 className="text-3xl font-bold">Counter</h2>
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
              <span className={cn(index > 0 && 'text-blue-300')}>{getServiceAbbreviation(item.serviceLabel)}</span>
              <div className="flex flex-col items-center">
                 { index === 0 && <Badge className="bg-red-600 text-white text-lg mb-1 -mt-1">PRIORITY</Badge>}
                <span className="leading-none">{item.ticketNumber}</span>
                { index > 0 && <div className="h-1 w-16 bg-white/50 mt-1"></div> }
              </div>
              <span>{item.stationName.replace('Window ', '')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
