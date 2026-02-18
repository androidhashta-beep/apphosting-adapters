"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueue } from "@/contexts/QueueProvider";
import { suggestStationAssignments, SuggestStationAssignmentsOutput } from "@/ai/flows/suggest-station-assignments";
import type { StationMode, StationType } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrainCircuit, Bot, Loader2, Trash2, RefreshCw, ArrowLeft } from "lucide-react";
import { SuggestionCard } from "./SuggestionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CarouselSettings } from "./CarouselSettings";
import { useToast } from "@/hooks/use-toast";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Skeleton } from "@/components/ui/skeleton";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";


export function AdminClient() {
  const { state, dispatch, getWaitingTickets, getTicketByStation, isHydrated } = useQueue();
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestStationAssignmentsOutput | null>(null);

  const [newStationName, setNewStationName] = useState("");
  const [newStationType, setNewStationType] = useState<StationType>("enrollment");
  const [stationToDelete, setStationToDelete] = useState<string | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestion = async () => {
    if (!isHydrated) return;
    setLoading(true);
    setSuggestion(null);
    try {
      const result = await suggestStationAssignments({
        enrollmentQueueLength: getWaitingTickets('enrollment').length,
        paymentQueueLength: getWaitingTickets('payment').length,
        certificateQueueLength: getWaitingTickets('certificate').length,
        availableEnrollmentStations: state.stations.filter(s => s.type === 'enrollment' && s.status === 'open').length,
        availablePaymentStations: state.stations.filter(s => s.type === 'payment' && s.status === 'open').length,
        availableCertificateStations: state.stations.filter(s => s.type === 'certificate' && s.status === 'open').length,
      });
      setSuggestion(result);
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Could not fetch AI suggestions. Please check your internet connection.",
      });
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
    setNewStationType('enrollment');
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

    const mainContent = (
      !isHydrated ? (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-center">
                    {[...Array(6)].map((_, i) => (
                        <div key={i}>
                            <Skeleton className="h-7 w-12 mx-auto" />
                            <Skeleton className="h-4 w-24 mx-auto mt-2" />
                        </div>
                    ))}
                </div>
                <Skeleton className="h-10 w-[180px]" />
            </CardContent>
        </Card>
    ) : (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="text-primary" />
                        <span>AI-Powered Suggestions</span>
                    </div>
                </CardTitle>
                <CardDescription>
                    Get optimal station assignments to efficiently manage student flow based on real-time data.
                </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-center">
                <div><p className="font-bold text-2xl">{getWaitingTickets('enrollment').length}</p><p className="text-sm text-muted-foreground">Enrollment Queue</p></div>
                <div><p className="font-bold text-2xl">{getWaitingTickets('payment').length}</p><p className="text-sm text-muted-foreground">Payment Queue</p></div>
                <div><p className="font-bold text-2xl">{getWaitingTickets('certificate').length}</p><p className="text-sm text-muted-foreground">Certificate Queue</p></div>
                <div><p className="font-bold text-2xl">{state.stations.filter(s => s.type === 'enrollment' && s.status === 'open').length}</p><p className="text-sm text-muted-foreground">Open Enrollment</p></div>
                <div><p className="font-bold text-2xl">{state.stations.filter(s => s.type === 'payment' && s.status === 'open').length}</p><p className="text-sm text-muted-foreground">Open Payment</p></div>
                <div><p className="font-bold text-2xl">{state.stations.filter(s => s.type === 'certificate' && s.status === 'open').length}</p><p className="text-sm text-muted-foreground">Open Certificate</p></div>
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
      )
    );

    const sidebarContent = (
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
                        disabled={!isHydrated}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-station-type">Station Type</Label>
                      <Select
                        value={newStationType}
                        onValueChange={(value: StationType) => setNewStationType(value)}
                        disabled={!isHydrated}
                      >
                        <SelectTrigger id="new-station-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enrollment">Enrollment</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="certificate">Certificate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={!isHydrated}>Add Station</Button>
                  </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                  <CardTitle>Station Management</CardTitle>
                  <CardDescription>Manually configure station operational modes. Changes are saved automatically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isHydrated && [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-md border h-[72px]">
                          <div className="w-full">
                              <Skeleton className="h-5 w-32 mb-1" />
                              <Skeleton className="h-4 w-20" />
                          </div>
                      </div>
                  ))}
                  {isHydrated && state.stations.map((station) => {
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
                  <Button variant="outline" onClick={() => setIsRestoreConfirmOpen(true)} disabled={!isHydrated}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Restore Default Stations
                  </Button>
                  <p className="text-xs text-muted-foreground">Restoring will clear all current tickets and reset stations to their initial configuration.</p>
                </CardFooter>
            </Card>
            <CarouselSettings />
        </div>
    );


  return (
    <div className="flex flex-col h-screen">
       <header className="border-b">
          <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
              <div className="flex items-center gap-4 w-1/3">
                  <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowLeft className="h-4 w-4" />
                      Home
                  </Link>
              </div>
              <div className="flex items-center justify-center w-1/3">
                  <h1 className="text-lg font-bold md:text-xl whitespace-nowrap">Admin Panel</h1>
              </div>
              <div className="w-1/3 flex justify-end">
                  <ThemeSwitcher />
              </div>
          </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={60} minSize={40}>
          <ScrollArea className="h-full">
            <div className="p-6">
              {mainContent}
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={30}>
          <ScrollArea className="h-full">
            <div className="p-6">
              {sidebarContent}
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
      
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
    </div>
  );
}
