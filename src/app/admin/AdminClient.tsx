"use client";

import { useState } from "react";
import { useQueue } from "@/contexts/QueueProvider";
import { suggestStationAssignments, SuggestStationAssignmentsOutput } from "@/ai/flows/suggest-station-assignments";
import type { StationMode, StationType } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrainCircuit, Bot, Loader2, Trash2, RefreshCw } from "lucide-react";
import { SuggestionCard } from "./SuggestionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CarouselSettings } from "./CarouselSettings";

export function AdminClient() {
  const { state, dispatch, getWaitingTickets, getTicketByStation } = useQueue();
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestStationAssignmentsOutput | null>(null);

  const [newStationName, setNewStationName] = useState("");
  const [newStationType, setNewStationType] = useState<StationType>("counter");
  const [stationToDelete, setStationToDelete] = useState<string | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);

  const counterQueueLength = getWaitingTickets('counter').length;
  const cashierQueueLength = getWaitingTickets('cashier').length;
  const certificateQueueLength = getWaitingTickets('certificate').length;
  const availableCounters = state.stations.filter(s => s.type === 'counter' && s.status === 'open').length;
  const availableCashiers = state.stations.filter(s => s.type === 'cashier' && s.status === 'open').length;
  const availableCertificateStations = state.stations.filter(s => s.type === 'certificate' && s.status === 'open').length;

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
        availableCertificateStations,
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

  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim()) return;
    dispatch({ type: 'ADD_STATION', payload: { name: newStationName, type: newStationType } });
    setNewStationName('');
    setNewStationType('counter');
  };

  const handleDeleteStation = () => {
    if (stationToDelete) {
        dispatch({ type: 'REMOVE_STATION', payload: { stationId: stationToDelete } });
        setStationToDelete(null);
    }
  }

  const handleConfirmRestore = () => {
    dispatch({ type: 'RESET_STATE' });
    setIsRestoreConfirmOpen(false);
  };

  return (
    <>
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
                <div><p className="font-bold text-2xl">{availableCertificateStations}</p><p className="text-sm text-muted-foreground">Open Certificate</p></div>
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
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Add Station</CardTitle>
              <CardDescription>Create a new service station.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-station-name">Station Name</Label>
                  <Input
                    id="new-station-name"
                    value={newStationName}
                    onChange={(e) => setNewStationName(e.target.value)}
                    placeholder="e.g. Certificate Claim"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-station-type">Station Type</Label>
                  <Select
                    value={newStationType}
                    onValueChange={(value: StationType) => setNewStationType(value)}
                  >
                    <SelectTrigger id="new-station-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="counter">Counter</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Add Station</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Station Management</CardTitle>
              <CardDescription>Manually configure station operational modes. Changes are saved automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.stations.map((station) => {
                const isServing = !!getTicketByStation(station.id);
                return (
                <div key={station.id} className="flex items-center justify-between p-2 rounded-md border">
                  <div>
                    <p className="font-semibold">{station.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{station.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setStationToDelete(station.id)}
                        className="text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isServing || state.stations.length <= 1}
                        title={isServing ? "Cannot delete station while it is serving." : state.stations.length <= 1 ? "Cannot delete the last station." : "Delete station"}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                );
            })}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={() => setIsRestoreConfirmOpen(true)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restore Default Stations
              </Button>
              <p className="text-xs text-muted-foreground">Restoring will clear all current tickets and reset stations to their initial configuration.</p>
            </CardFooter>
          </Card>
          <CarouselSettings />
        </div>
      </div>
      <AlertDialog open={!!stationToDelete} onOpenChange={(open) => !open && setStationToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the station. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setStationToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteStation} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isRestoreConfirmOpen} onOpenChange={setIsRestoreConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will reset all stations to their default configuration and clear all tickets. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmRestore} className="bg-destructive hover:bg-destructive/90">Restore</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
