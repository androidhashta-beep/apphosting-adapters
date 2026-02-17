"use client";

import { useState } from "react";
import { useQueue } from "@/contexts/QueueProvider";
import { suggestStationAssignments, SuggestStationAssignmentsOutput } from "@/ai/flows/suggest-station-assignments";
import type { StationMode } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrainCircuit, Bot, Loader2 } from "lucide-react";
import { SuggestionCard } from "./SuggestionCard";

export function AdminClient() {
  const { state, dispatch, getWaitingTickets } = useQueue();
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestStationAssignmentsOutput | null>(null);

  const counterQueueLength = getWaitingTickets('counter').length;
  const cashierQueueLength = getWaitingTickets('cashier').length;
  const certificateQueueLength = getWaitingTickets('certificate').length;
  const availableCounters = state.stations.filter(s => s.type === 'counter' && s.status === 'open').length;
  const availableCashiers = state.stations.filter(s => s.type === 'cashier' && s.status === 'open').length;

  const handleGetSuggestion = async () => {
    setLoading(true);
    setSuggestion(null);
    try {
      const result = await suggestStationAssignments({
        counterQueueLength,
        cashierQueueLength,
        certificateQueueLength,
        availableCounters,
        availableCashiers,
      });
      setSuggestion(result);
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (stationId: string, mode: StationMode) => {
    dispatch({ type: 'UPDATE_STATION_MODE', payload: { stationId, mode } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="text-primary" />
              <span>AI-Powered Suggestions</span>
            </CardTitle>
            <CardDescription>
              Get optimal station assignments to efficiently manage student flow based on real-time data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-center">
              <div><p className="font-bold text-2xl">{counterQueueLength}</p><p className="text-sm text-muted-foreground">Counter Queue</p></div>
              <div><p className="font-bold text-2xl">{cashierQueueLength}</p><p className="text-sm text-muted-foreground">Cashier Queue</p></div>
              <div><p className="font-bold text-2xl">{certificateQueueLength}</p><p className="text-sm text-muted-foreground">Certificate Queue</p></div>
              <div><p className="font-bold text-2xl">{availableCounters}</p><p className="text-sm text-muted-foreground">Open Counters</p></div>
              <div><p className="font-bold text-2xl">{availableCashiers}</p><p className="text-sm text-muted-foreground">Open Cashiers</p></div>
            </div>
            <Button onClick={handleGetSuggestion} disabled={loading} className="w-full md:w-auto">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bot className="mr-2 h-4 w-4" />
              )}
              {loading ? "Analyzing..." : "Get Suggestions"}
            </Button>
            {suggestion && (
              <div className="mt-6 space-y-4">
                <Card className="bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-lg">Overall Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{suggestion.overallSummary}</p>
                    </CardContent>
                </Card>
                <div className="space-y-4">
                  {suggestion.suggestions.map((s, i) => (
                    <SuggestionCard key={i} suggestion={s} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Station Management</CardTitle>
            <CardDescription>Manually configure station operational modes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.stations.map((station) => (
              <div key={station.id} className="flex items-center justify-between p-2 rounded-md border">
                <div>
                  <p className="font-semibold">{station.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{station.type}</p>
                </div>
                <Select
                  value={station.mode}
                  onValueChange={(value: StationMode) => handleModeChange(station.id, value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="all-in-one">All-in-One</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
