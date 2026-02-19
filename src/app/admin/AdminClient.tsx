
"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueue } from "@/contexts/QueueProvider";
import type { StationMode, StationType, StationStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, RefreshCw, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CarouselSettings } from "./CarouselSettings";
import { useToast } from "@/hooks/use-toast";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";


export function AdminClient() {
  const { state, dispatch, isHydrated } = useQueue();

  const [newStationName, setNewStationName] = useState("");
  const [newStationType, setNewStationType] = useState<StationType>("enrollment");
  const [stationToDelete, setStationToDelete] = useState<string | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const { toast } = useToast();

  const handleModeChange = (stationId: string, mode: StationMode) => {
    dispatch({ type: 'UPDATE_STATION_MODE', payload: { stationId, mode } });
  };

  const handleStatusChange = (stationId: string, checked: boolean) => {
    const newStatus: StationStatus = checked ? 'open' : 'closed';
    dispatch({ type: 'UPDATE_STATION_STATUS', payload: { stationId, status: newStatus } });
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

      <ScrollArea className="flex-grow">
        <div className="grid grid-cols-1 items-start gap-8 p-6 lg:grid-cols-2">
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
                <CarouselSettings />
            </div>
            <Card>
                <CardHeader>
                  <CardTitle>Station Management</CardTitle>
                  <CardDescription>Configure station status and operational modes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isHydrated && [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-md border h-[180px]">
                          <Skeleton className="h-full w-full" />
                      </div>
                  ))}
                  {isHydrated && state.stations.map((station) => {
                    const isServing = !!state.stations.find(s => s.id === station.id)?.currentTicketId;
                    const isClosed = station.status === 'closed';
                    const isLastStation = state.stations.length <= 1;
                    const isDeleteDisabled = (isServing && !isClosed) || isLastStation;

                    let deleteTooltip = "Delete station";
                    if (isLastStation) {
                      deleteTooltip = "Cannot delete the last station.";
                    } else if (isServing && !isClosed) {
                      deleteTooltip = "Station is busy. Close it first to enable deletion.";
                    }

                    return (
                      <div key={station.id} className="space-y-3 rounded-md border p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{station.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{station.type}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setStationToDelete(station.id)}
                            className="text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed -mr-2 -mt-2 shrink-0"
                            disabled={isDeleteDisabled}
                            title={deleteTooltip}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                        <div className="space-y-2">
                            <Label>Operational Mode</Label>
                            <Select
                                value={station.mode}
                                onValueChange={(value: StationMode) => handleModeChange(station.id, value)}
                                disabled={isClosed}
                            >
                                <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="all-in-one">All-in-One</SelectItem>
                                <SelectItem value="payment-only">Payment-only</SelectItem>
                                <SelectItem value="certificate-only">Certificate-only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor={`status-switch-${station.id}`} className="cursor-pointer">
                                    Station Status
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {isClosed ? "Station is offline." : "Station is open for service."}
                                </p>
                            </div>
                            <Switch
                              id={`status-switch-${station.id}`}
                              checked={!isClosed}
                              onCheckedChange={(checked) => handleStatusChange(station.id, checked)}
                            />
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
        </div>
      </ScrollArea>
      
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
