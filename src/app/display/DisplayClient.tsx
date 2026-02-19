"use client";

import { useQueue } from "@/contexts/QueueProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdCarousel } from "./AdCarousel";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export function DisplayClient() {
  const { state, isHydrated } = useQueue();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Set initial time on client mount to avoid hydration mismatch
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };

  const recentlyCalledTickets = state.tickets
    .filter(t => t.status === 'serving' || t.status === 'served' || t.status === 'skipped')
    .sort((a, b) => (b.calledAt ?? 0) - (a.calledAt ?? 0))
    .slice(0, 10);

  const getStationName = (stationId: string | undefined) => {
    if (!stationId) return '-';
    return state.stations.find(s => s.id === stationId)?.name || '-';
  }
  
  const getServiceLabel = (serviceId: string) => {
      const service = state.settings.services.find(s => s.id === serviceId);
      return service ? service.label.toUpperCase() : 'SERVICE';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Section: Queue List */}
      <div className="lg:col-span-1 h-full">
        <Card className="flex flex-col h-full">
          <CardHeader className="p-4 border-b border-gold">
            <div className="grid grid-cols-3 text-center font-bold text-muted-foreground uppercase">
              <div>Queue No.</div>
              <div>Services</div>
              <div>Counter</div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow overflow-y-auto">
            <div className="flex flex-col gap-3">
              {!isHydrated && [...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              {isHydrated && recentlyCalledTickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className={cn(
                    "grid grid-cols-3 items-center text-center p-3 rounded-lg text-2xl font-bold transition-all",
                    {
                      "bg-destructive text-destructive-foreground animate-pulse": ticket.status === 'serving',
                      "bg-card border border-gold": ticket.status === 'served',
                      "bg-muted text-muted-foreground opacity-60 line-through": ticket.status === 'skipped',
                    }
                  )}
                >
                  <div>{ticket.ticketNumber}</div>
                  <div className="text-xl">{getServiceLabel(ticket.type)}</div>
                  <div>{getStationName(ticket.servedBy)}</div>
                </div>
              ))}
              {isHydrated && recentlyCalledTickets.length === 0 && (
                 <div className="flex items-center justify-center h-full py-10">
                    <p className="text-muted-foreground">Waiting for next ticket...</p>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Section: Ads and Info */}
      <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
        <div className="flex-grow min-h-0">
            <AdCarousel />
        </div>
        <Card>
            <CardContent className="p-4 flex justify-between items-center">
                <p className="font-semibold text-muted-foreground">{currentTime?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="flex items-center gap-4">
                  <p className="text-2xl font-bold font-mono text-foreground">
                      {currentTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                  </p>
                  <ThemeSwitcher />
                   <Button variant="outline" size="icon" onClick={handleGoHome}>
                      <Home className="h-[1.2rem] w-[1.2rem]" />
                      <span className="sr-only">Home</span>
                  </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
