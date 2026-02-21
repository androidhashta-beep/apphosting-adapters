'use client';

import { useState, useMemo } from 'react';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import {
  doc,
  collection,
  writeBatch,
  runTransaction,
  arrayUnion,
  arrayRemove,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import type { Settings, Station, Service } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle, RefreshCw, ServerCrash, Save, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

const handleFirestoreError = (error: any, toast: any, operation: string) => {
    let title;
    let description;

    if (error.code === 'unavailable' || error.code === 'network-request-failed') {
        title = "CRITICAL: Connection Blocked by Firewall";
        description = "The application cannot connect to the local database because your PC's firewall is blocking it. This is a system configuration issue, not an application bug. Please allow the app through your firewall.";
    } else if (error.code === 'permission-denied') {
        title = "Permission Denied";
        description = "You do not have permission to perform this action. Check your security rules.";
    } else {
        // Generic fallback for other errors.
        title = `Operation Failed: ${operation}`;
        description = "An unexpected error occurred. Please try again.";
    }
    toast({
        variant: "destructive",
        title: title,
        description: description,
        duration: 20000,
    });
}

export function StationManagement() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'app') : null), [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);
  
  const stationsCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'stations') : null), [firestore]);
  const { data: stations, isLoading: isLoadingStations } = useCollection<Station>(stationsCollectionRef);

  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const isLoading = isLoadingSettings || isLoadingStations;

  const sortedStations = useMemo(() => {
    if (!stations) return [];
    return [...stations].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [stations]);

  const handleAddStation = async () => {
    if (!firestore) return;

    try {
        const stationsCollection = collection(firestore, 'stations');
        
        await runTransaction(firestore, async (transaction) => {
            const stationSnapshot = await transaction.get(stationsCollection);
            
            const existingNames = stationSnapshot.docs.map(doc => doc.data().name);
            let nextStationNumber = 1;
            while (existingNames.includes(`Window ${nextStationNumber}`)) {
              nextStationNumber++;
            }

            const newStationName = `Window ${nextStationNumber}`;
            const newStationId = `window-${nextStationNumber}`;
            
            const stationRef = doc(firestore, 'stations', newStationId);
            transaction.set(stationRef, {
                id: newStationId,
                name: newStationName,
                status: 'closed',
                serviceIds: [],
            });
        });
        toast({ title: "Station Added", description: "A new station has been created." });
    } catch (error: any) {
        handleFirestoreError(error, toast, 'Add Station');
    }
  };
  
  const handleSaveAsDefault = async () => {
    if (!firestore || !settingsRef || !stations || !settings) return;

    const defaultConfiguration = {
        services: settings.services || [],
        stations: stations || [],
    };

    try {
        await updateDoc(settingsRef, { defaultConfiguration });
        toast({
            title: "Default Configuration Saved",
            description: "The current station and service setup is now the new default.",
        });
    } catch (error: any) {
        handleFirestoreError(error, toast, "Save as Default");
    }
  };

  const handleRestoreDefaults = async () => {
    if (!firestore) return;

    toast({ title: "Restoring Defaults", description: "Applying default configuration..." });
      
    try {
        const batch = writeBatch(firestore);

        const stationsQuerySnapshot = await getDocs(collection(firestore, 'stations'));
        stationsQuerySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        if (settings?.defaultConfiguration?.stations?.length) {
            const { services: defaultServices, stations: defaultStations } = settings.defaultConfiguration;

            const settingsDocRef = doc(firestore, 'settings', 'app');
            batch.set(settingsDocRef, { services: defaultServices || [], defaultConfiguration: settings.defaultConfiguration }, { merge: true });

            (defaultStations || []).forEach((station: Station) => {
                const stationRef = doc(firestore, 'stations', station.id);
                batch.set(stationRef, station);
            });

            await batch.commit();

            toast({
                title: "Custom Defaults Restored",
                description: `Configuration restored to your saved default.`
            });
        } else {
            const defaultServices: Service[] = [
                { id: 'registration', label: 'Registration', description: 'Student registration process', icon: 'UserPlus' },
                { id: 'cashier', label: 'Cashier', description: 'Payment of fees', icon: 'DollarSign' },
                { id: 'certificate-claiming', label: 'Certificate Claiming', description: 'Claiming of certificates', icon: 'Award' },
                { id: 'information', label: 'Information', description: 'General inquiries', icon: 'HelpCircle' },
            ];
            
            const settingsDocRef = doc(firestore, 'settings', 'app');
            batch.set(settingsDocRef, { services: defaultServices }, { merge: true });

            for (let i = 1; i <= 5; i++) {
                const stationId = `window-${i}`;
                const stationRef = doc(firestore, 'stations', stationId);
                batch.set(stationRef, {
                    id: stationId,
                    name: `Window ${i}`,
                    status: 'closed',
                    serviceIds: [],
                });
            }
            
            await batch.commit();

            toast({
                title: "Defaults Restored",
                description: `Removed old config and created 4 default services and 5 default stations.`
            });
        }
    } catch (error: any) {
        handleFirestoreError(error, toast, 'Restore Defaults');
    }
  };

  const handleUpdateStationName = async (stationId: string, newName: string) => {
    if (!firestore) return;
    if (!newName.trim()) {
        toast({ variant: 'destructive', title: "Invalid Name", description: "Station name cannot be empty." });
        return;
    }
    const stationRef = doc(firestore, 'stations', stationId);
    try {
        await updateDoc(stationRef, { name: newName });
        toast({ title: "Station Updated", description: "Station name has been changed." });
    } catch (error) {
        handleFirestoreError(error, toast, "Update Station Name");
    }
  };
  
  const handleServiceSelectionChange = async (stationId: string, serviceId: string, isSelected: boolean) => {
    if (!firestore) return;
    const stationRef = doc(firestore, 'stations', stationId);
    
    try {
        await updateDoc(stationRef, {
            serviceIds: isSelected ? arrayUnion(serviceId) : arrayRemove(serviceId)
        });
        toast({ title: "Station Updated", description: "Service assignment has been changed."});
    } catch (error) {
        handleFirestoreError(error, toast, "Update Service Assignment");
    }
  };

  const confirmDeleteStation = async () => {
    if (!stationToDelete || !firestore) return;
    const stationRef = doc(firestore, 'stations', stationToDelete.id);
    try {
        await deleteDoc(stationRef);
        toast({ title: 'Station Deleted', description: `"${stationToDelete.name}" has been removed.` });
        setStationToDelete(null);
    } catch (error) {
        handleFirestoreError(error, toast, "Delete Station");
        setStationToDelete(null);
    }
  }

  const confirmResetQueues = async () => {
    if (!firestore) return;

    toast({ title: "Resetting All Queues...", description: "Please wait." });

    try {
        const batch = writeBatch(firestore);

        const ticketsSnapshot = await getDocs(collection(firestore, 'tickets'));
        ticketsSnapshot.forEach(doc => batch.delete(doc.ref));

        const countersSnapshot = await getDocs(collection(firestore, 'counters'));
        countersSnapshot.forEach(doc => batch.delete(doc.ref));
        
        if (stations) {
            stations.forEach(station => {
                const stationRef = doc(firestore, 'stations', station.id);
                batch.update(stationRef, { currentTicketId: null });
            });
        }

        await batch.commit();

        toast({
            title: "All Queues Reset Successfully",
            description: "All tickets and counters have been cleared.",
        });
    } catch (error: any) {
        handleFirestoreError(error, toast, "Reset All Queues");
    } finally {
        setIsResetConfirmOpen(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Station Management</CardTitle>
          <CardDescription>
            Configure service windows and the types of services they can render.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && (
              <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
              </div>
          )}

          {!isLoading && sortedStations.length === 0 && (
             <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                <ServerCrash className="h-10 w-10 mb-4" />
                <p className="font-semibold text-lg">No Stations Found</p>
                <p className="text-sm">Click "Restore Defaults" to create 5 default stations or "Add Station" to create one manually.</p>
            </div>
          )}

          {!isLoading && sortedStations.map(station => (
              <div key={station.id} className="p-4 border rounded-lg space-y-4 bg-background shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <Input
                          defaultValue={station.name}
                          onBlur={(e) => handleUpdateStationName(station.id, e.target.value)}
                          aria-label="Station name"
                          className="text-lg font-bold max-w-xs"
                      />
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive self-end sm:self-center" onClick={() => setStationToDelete(station)}>
                          <Trash2 className="h-5 w-5" />
                          <span className="sr-only">Delete station</span>
                      </Button>
                  </div>
                  <div className="space-y-3">
                      <Label className="text-sm font-medium">Rendered Services</Label>
                      <div className="space-y-2 rounded-md border bg-card p-4">
                          {isLoadingSettings ? (
                              <Skeleton className="h-20 w-full" />
                          ) : settings?.services?.length ? (
                              settings.services.map(service => (
                                  <div key={service.id} className="flex items-center space-x-2">
                                      <Checkbox
                                          id={`service-${station.id}-${service.id}`}
                                          checked={(station.serviceIds || []).includes(service.id)}
                                          onCheckedChange={(checked) => handleServiceSelectionChange(station.id, service.id, !!checked)}
                                          disabled={isLoading}
                                      />
                                      <Label htmlFor={`service-${station.id}-${service.id}`} className="font-normal cursor-pointer">
                                          {service.label}
                                      </Label>
                                  </div>
                              ))
                          ) : (
                              <p className="text-sm text-muted-foreground p-2">No services found. Try restoring defaults.</p>
                          )}
                      </div>
                  </div>
              </div>
          ))}
        </CardContent>
        <CardFooter className="border-t pt-6 grid grid-cols-2 gap-2">
            <Button className="w-full" onClick={handleAddStation} disabled={isLoading}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Station
            </Button>
            <Button variant="outline" className="w-full" onClick={handleSaveAsDefault} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" /> Save as Default
            </Button>
            <Button variant="outline" className="w-full" onClick={handleRestoreDefaults} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" /> Restore Defaults
            </Button>
             <Button variant="destructive" className="w-full" onClick={() => setIsResetConfirmOpen(true)} disabled={isLoading}>
                <ShieldAlert className="mr-2 h-4 w-4" /> Reset All Queues
            </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={!!stationToDelete} onOpenChange={(open) => !open && setStationToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the <strong>{stationToDelete?.name}</strong> station.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setStationToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteStation} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This is a highly destructive action that cannot be undone. This will permanently delete <strong>all tickets</strong> and reset <strong>all queue counters</strong> to 1. Use this for a clean daily start.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmResetQueues} className="bg-destructive hover:bg-destructive/90">Yes, Reset Everything</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
