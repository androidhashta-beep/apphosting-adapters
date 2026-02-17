"use client";

import { useQueue } from "@/contexts/QueueProvider";
import { StationControlCard } from "./StationControlCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StaffClient() {
  const { state, getWaitingTickets } = useQueue();

  const counterWaitingCount = getWaitingTickets('counter').length;
  const cashierWaitingCount = getWaitingTickets('cashier').length;
  const certificateWaitingCount = getWaitingTickets('certificate').length;
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Counter Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{counterWaitingCount}</p>
            <p className="text-muted-foreground">students waiting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cashier Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{cashierWaitingCount}</p>
            <p className="text-muted-foreground">students waiting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Certificate Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{certificateWaitingCount}</p>
            <p className="text-muted-foreground">students waiting</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {state.stations.map((station) => (
          <StationControlCard key={station.id} station={station} />
        ))}
      </div>
    </div>
  );
}
