
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueue } from "@/contexts/QueueProvider";
import type { StationMode, StationType, StationStatus, State, Service } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, RefreshCw, ArrowLeft, Download, Upload, PlusCircle, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CarouselSettings } from "./CarouselSettings";
import { useToast } from "@/hooks/use-toast";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Icon, iconList } from "@/lib/icons";

export function AdminClient() {
  const router = useRouter();
  const { state, dispatch, isHydrated } = useQueue();
  const { toast } = useToast();

  const [newStationName, setNewStationName] = useState("");
  const [newStationType, setNewStationType] = useState<StationType>("");
  
  const [stationToDelete, setStationToDelete] = useState<string | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoreBackupConfirmOpen, setIsRestoreBackupConfirmOpen] = useState(false);
  const [pendingState, setPendingState] = useState<State | null>(null);

  const [companyName, setCompanyName] = useState(state.settings.companyName);
  
  const [isServiceEditorOpen, setIsServiceEditorOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  useEffect(() => {
    if (isHydrated) {
        setCompanyName(state.settings.companyName);
        if (state.settings.services.length > 0 && !newStationType) {
            setNewStationType(state.settings.services[0].id);
        }
    }
  }, [isHydrated, state.settings.companyName, state.settings.services, newStationType]);

  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };

  const handleModeChange = (stationId: string, mode: StationMode) => {
    dispatch({ type: 'UPDATE_STATION_MODE', payload: { stationId, mode } });
  };

  const handleStatusChange = (stationId: string, checked: boolean) => {
    const newStatus: StationStatus = checked ? 'open' : 'closed';
    dispatch({ type: 'UPDATE_STATION_STATUS', payload: { stationId, status: newStatus } });
  };

  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim() || !newStationType) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please provide a station name and select a type." });
        return;
    };
    dispatch({ type: 'ADD_STATION', payload: { name: newStationName, type: newStationType } });
    setNewStationName('');
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

  const handleBackup = () => {
    try {
        const stateJSON = JSON.stringify(state, null, 2);
        const blob = new Blob([stateJSON], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `queue-backup-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Backup Successful", description: "Your queue data has been saved." });
    } catch (error) {
        console.error("Backup failed", error);
        toast({ variant: "destructive", title: "Backup Failed", description: "Could not create backup file." });
    }
  };

  const handleRestoreClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') throw new Error("File is not a valid text file.");
              const restoredState = JSON.parse(text);
              if (restoredState && restoredState.tickets && restoredState.stations && restoredState.settings) {
                  setPendingState(restoredState);
                  setIsRestoreBackupConfirmOpen(true);
              } else {
                  throw new Error("Invalid backup file format.");
              }
          } catch (error: any) {
              toast({ variant: "destructive", title: "Restore Failed", description: error.message || "The selected file is not a valid backup." });
          } finally {
              if (fileInputRef.current) fileInputRef.current.value = "";
          }
      };
      reader.readAsText(file);
  };

  const confirmRestoreFromBackup = () => {
      if (pendingState) {
          dispatch({ type: 'RESTORE_FROM_BACKUP', payload: pendingState });
          toast({ title: "Restore Successful", description: "Queue data has been restored from backup." });
      }
      setIsRestoreBackupConfirmOpen(false);
      setPendingState(null);
  };
  
  const handleCompanyNameSave = () => {
      dispatch({type: 'UPDATE_SETTINGS', payload: { companyName }});
      toast({ title: "Settings Saved", description: "Company name has been updated." });
  }

  const handleSaveService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get('id') as string;
    const label = formData.get('label') as string;
    const description = formData.get('description') as string;
    const icon = formData.get('icon') as string;

    if (!id || !label || !description || !icon) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all fields for the service." });
        return;
    }
    
    const service: Service = { id: id.toLowerCase().replace(/\s+/g, '-'), label, description, icon };
    
    let services = [...state.settings.services];
    if (editingService) { // Update existing
        const index = services.findIndex(s => s.id === editingService.id);
        if (index > -1) services[index] = service;
    } else { // Add new
        if (services.some(s => s.id === service.id)) {
            toast({ variant: "destructive", title: "ID already exists", description: `Service ID "${service.id}" is already in use. Please choose a unique label.` });
            return;
        }
        services.push(service);
    }

    dispatch({type: 'UPDATE_SETTINGS', payload: { services }});
    toast({ title: "Service Saved", description: `Service "${label}" has been saved.` });
    setIsServiceEditorOpen(false);
    setEditingService(null);
  };

  const openServiceEditor = (service: Service | null) => {
    setEditingService(service);
    setIsServiceEditorOpen(true);
  }

  const handleDeleteService = () => {
    if (serviceToDelete) {
        dispatch({ type: 'REMOVE_SERVICE', payload: { serviceId: serviceToDelete.id } });
        toast({ title: "Service Removed", description: `Service "${serviceToDelete.label}" and its associated stations have been removed.` });
        setServiceToDelete(null);
    }
  }
  
  return (
    <div className="flex flex-col h-screen">
       <header className="border-b">
          <div className="container relative mx-auto flex h-16 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-4">
                  <button onClick={handleGoHome} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowLeft className="h-4 w-4" />
                      Home
                  </button>
              </div>
              <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold md:text-xl whitespace-nowrap">Admin Panel</h1>
              <div className="flex items-center gap-4">
                <ThemeSwitcher />
              </div>
          </div>
      </header>

      <ScrollArea className="flex-grow">
        <div className="grid grid-cols-1 items-start gap-8 p-6 lg:grid-cols-2">
            <div className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Company Settings</CardTitle>
                        <CardDescription>Set the name of your organization.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} disabled={!isHydrated} />
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleCompanyNameSave} disabled={!isHydrated}>Save</Button>
                    </CardFooter>
                 </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Service Types</CardTitle>
                        <CardDescription>Manage the services offered at the kiosk.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {isHydrated && state.settings.services.map(service => (
                            <div key={service.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                                <div className="flex items-center gap-3">
                                    <Icon name={service.icon} className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">{service.label}</p>
                                        <p className="text-sm text-muted-foreground">{service.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openServiceEditor(service)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setServiceToDelete(service)} disabled={state.settings.services.length <= 1}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => openServiceEditor(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Service
                        </Button>
                    </CardFooter>
                 </Card>
                <Card>
                    <CardHeader>
                      <CardTitle>Add Station</CardTitle>
                      <CardDescription>Create a new service station.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddStation} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-station-name">Station Name</Label>
                          <Input id="new-station-name" value={newStationName} onChange={(e) => setNewStationName(e.target.value)} placeholder="e.g. Certificate Claim" required disabled={!isHydrated} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-station-type">Station Type</Label>
                          <Select value={newStationType} onValueChange={(value: StationType) => setNewStationType(value)} disabled={!isHydrated}>
                            <SelectTrigger id="new-station-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {state.settings.services.map(service => (
                                <SelectItem key={service.id} value={service.id}>{service.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full" disabled={!isHydrated}>Add Station</Button>
                      </form>
                    </CardContent>
                </Card>
                <CarouselSettings />
                <Card>
                    <CardHeader>
                        <CardTitle>Backup &amp; Restore</CardTitle>
                        <CardDescription>Save and load all queue data to or from a file.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button onClick={handleBackup} variant="outline" className="w-full" disabled={!isHydrated}><Download className="mr-2 h-4 w-4" />Backup Queue Data</Button>
                        <Button onClick={handleRestoreClick} variant="outline" className="w-full" disabled={!isHydrated}><Upload className="mr-2 h-4 w-4" />Restore Queue Data</Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json" />
                    </CardContent>
                    <CardFooter>
                        <p className="text-xs text-muted-foreground">This is useful for moving data between computers or creating a manual save point.</p>
                    </CardFooter>
                </Card>
            </div>
            <Card>
                <CardHeader>
                  <CardTitle>Station Management</CardTitle>
                  <CardDescription>Configure station status and operational modes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isHydrated && [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-md border h-[180px]"><Skeleton className="h-full w-full" /></div>
                  ))}
                  {isHydrated && state.stations.map((station) => {
                    const isServing = !!state.stations.find(s => s.id === station.id)?.currentTicketId;
                    const isClosed = station.status === 'closed';
                    const isDeleteDisabled = (isServing && !isClosed);
                    const serviceType = state.settings.services.find(s => s.id === station.type)?.label || station.type;

                    return (
                      <div key={station.id} className="space-y-3 rounded-md border p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{station.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{serviceType}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setStationToDelete(station.id)} className="text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed -mr-2 -mt-2 shrink-0" disabled={isDeleteDisabled} title={isDeleteDisabled ? "Station is busy. Close it first." : "Delete station"}>
                            <Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span>
                          </Button>
                        </div>
                        <div className="space-y-2">
                            <Label>Operational Mode</Label>
                            <Select value={station.mode} onValueChange={(value: StationMode) => handleModeChange(station.id, value)} disabled={isClosed}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select mode" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="regular">Regular</SelectItem>
                                    <SelectItem value="all-in-one">All-in-One</SelectItem>
                                    {/* These modes are less relevant now but kept for compatibility */}
                                    <SelectItem value="payment-only">Payment-only (Legacy)</SelectItem>
                                    <SelectItem value="certificate-only">Certificate-only (Legacy)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor={`status-switch-${station.id}`} className="cursor-pointer">Station Status</Label>
                                <p className="text-xs text-muted-foreground">{isClosed ? "Station is offline." : "Station is open for service."}</p>
                            </div>
                            <Switch id={`status-switch-${station.id}`} checked={!isClosed} onCheckedChange={(checked) => handleStatusChange(station.id, checked)} />
                        </div>
                      </div>
                    );
                })}
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 border-t px-6 py-4">
                  <Button variant="outline" onClick={() => setIsRestoreConfirmOpen(true)} disabled={!isHydrated}><RefreshCw className="mr-2 h-4 w-4" />Restore Default Stations</Button>
                  <p className="text-xs text-muted-foreground">Restoring will clear all current tickets and reset stations to their initial configuration.</p>
                </CardFooter>
            </Card>
        </div>
      </ScrollArea>
      
      {/* Dialogs */}
      <AlertDialog open={isServiceEditorOpen} onOpenChange={setIsServiceEditorOpen}>
        <AlertDialogContent>
            <form onSubmit={handleSaveService}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="service-label">Label</Label>
                        <Input id="service-label" name="label" defaultValue={editingService?.label} placeholder="e.g. Enrollment" required />
                        <Input id="service-id" name="id" defaultValue={editingService?.id} type="hidden" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="service-description">Description</Label>
                        <Textarea id="service-description" name="description" defaultValue={editingService?.description} placeholder="A short description for the kiosk screen." required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="service-icon">Icon</Label>
                        <Select name="icon" defaultValue={editingService?.icon || iconList[0]}>
                            <SelectTrigger id="service-icon"><SelectValue placeholder="Select an icon" /></SelectTrigger>
                            <SelectContent>
                                {iconList.map(iconName => (
                                    <SelectItem key={iconName} value={iconName}>
                                        <div className="flex items-center gap-2">
                                            <Icon name={iconName} className="h-4 w-4" />
                                            <span>{iconName}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">This icon will be shown on the kiosk button.</p>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button" onClick={() => setIsServiceEditorOpen(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction type="submit">Save Service</AlertDialogAction>
                </AlertDialogFooter>
            </form>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!stationToDelete} onOpenChange={(open) => !open && setStationToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the station. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel onClick={() => setStationToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteStation} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the "{serviceToDelete?.label}" service and any stations assigned to it. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel onClick={() => setServiceToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteService} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isRestoreConfirmOpen} onOpenChange={setIsRestoreConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will reset all stations and settings to their default configuration and clear all tickets. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmRestore} className="bg-destructive hover:bg-destructive/90">Restore</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       <AlertDialog open={isRestoreBackupConfirmOpen} onOpenChange={setIsRestoreBackupConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will overwrite all current data with the data from the backup file. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel onClick={() => { setPendingState(null); setIsRestoreBackupConfirmOpen(false); }}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmRestoreFromBackup}>Restore Backup</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
