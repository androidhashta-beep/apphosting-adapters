'use client';

import { useState, useMemo } from 'react';
import { useFirebase, useDoc, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, collection, writeBatch, getDocs, getDoc } from 'firebase/firestore';
import type { Settings, Station, Service } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle, RefreshCw, ServerCrash } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function StationManagement() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'app') : null), [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);
  
  const stationsCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'stations') : null), [firestore]);
  const { data: stations, isLoading: isLoadingStations } = useCollection<Station>(stationsCollectionRef);

  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);

  const isHydrated = !isLoadingSettings && !isLoadingStations;

  const sortedStations = useMemo(() => {
    if (!stations) return [];
    return [...stations].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [stations]);

  const handleAddStation = () => {
    if (!stationsCollectionRef) return;
    const newStationName = `Window ${ (stations?.length || 0) + 1 }`;
    addDocumentNonBlocking(stationsCollectionRef, {
        name: newStationName,
        status: 'closed',
        serviceId: null,
    });
    toast({ title: "Station Added", description: `Created station "${newStationName}".` });
  };
  
  const handleRestoreDefaults = async () => {
      if (!firestore) return;

      toast({ title: "Restoring Defaults", description: "Please wait..." });

      try {
        const stationsCollection = collection(firestore, 'stations');
        
        const defaultServices: Omit<Service, 'id'>[] = [
            { label: 'Registration', description: 'Student registration process', icon: 'UserPlus' },
            { label: 'Cashier', description: 'Payment of fees', icon: 'DollarSign' },
            { label: 'Certificate Claiming', description: 'Claiming of certificates', icon: 'Award' },
            { label: 'Information', description: 'General inquiries', icon: 'HelpCircle' },
        ];
        
        const settingsDocRef = doc(firestore, 'settings', 'app');
        const batch = writeBatch(firestore);

        const settingsSnapshot = await getDoc(settingsDocRef);
        const currentServices = settingsSnapshot.exists() ? (settingsSnapshot.data()?.services || []) : [];
        
        const servicesToAdd = defaultServices.filter(ds => !currentServices.some(cs => cs.label === ds.label));
        let finalServices = [...currentServices];
        let servicesAddedCount = 0;

        if (servicesToAdd.length > 0) {
            const newServices = servicesToAdd.map(s => ({...s, id: s.label.toLowerCase().replace(/\s/g, '-')}));
            finalServices = [...currentServices, ...newServices];
            batch.set(settingsDocRef, { services: finalServices }, { merge: true });
            servicesAddedCount = newServices.length;
        }
        
        const currentStationsSnapshot = await getDocs(stationsCollection);
        const existingStationNames = currentStationsSnapshot.docs.map(d => d.data().name);
        
        let stationsAddedCount = 0;
        for (let i = 1; i <= 5; i++) {
            const stationName = `Window ${i}`;
            if (!existingStationNames.includes(stationName)) {
                const newStationRef = doc(stationsCollection);
                batch.set(newStationRef, {
                    name: stationName,
                    status: 'closed',
                    serviceId: null,
                });
                stationsAddedCount++;
            }
        }
        
        await batch.commit();
        toast({
            title: "Defaults Restored",
            description: `Created ${servicesAddedCount} new service(s) and added ${stationsAddedCount} missing station(s).`
        });

      } catch (error: any) {
          if (error.code === 'unavailable') {
            console.warn(
              `[Firebase Firestore] Network Connection Blocked while restoring defaults. This is often a local firewall issue.

              >>> ACTION REQUIRED <<<
              If you are running the packaged desktop app, your PC's firewall might be blocking it. Please 'Allow an app through firewall' for your application's .exe file.`
            );
            toast({
              variant: 'destructive',
              title: "Connection Error",
              description: "Could not connect to the database. Please check your firewall settings and internet connection.",
              duration: 10000,
            });
          } else {
            console.error("Failed to restore defaults:", error);
            toast({ variant: 'destructive', title: "Restore Failed", description: error.message });
          }
      }
  };

  const handleUpdateStationName = (stationId: string, newName: string) => {
      if (!firestore) return;
      if (!newName.trim()) {
          toast({ variant: 'destructive', title: "Invalid Name", description: "Station name cannot be empty." });
          return;
      }
      const stationRef = doc(firestore, 'stations', stationId);
      updateDocumentNonBlocking(stationRef, { name: newName });
  };
  
  const handleServiceChange = (stationId: string, newServiceId: string) => {
      if (!firestore) return;
      const stationRef = doc(firestore, 'stations', stationId);
      const serviceIdToSave = newServiceId === 'null' ? null : newServiceId;
      updateDocumentNonBlocking(stationRef, { serviceId: serviceIdToSave });
  };

  const confirmDeleteStation = () => {
    if (!stationToDelete || !firestore) return;
    const stationRef = doc(firestore, 'stations', stationToDelete.id);
    deleteDocumentNonBlocking(stationRef);
    toast({ title: 'Station Deleted', description: `"${stationToDelete.name}" has been removed.` });
    setStationToDelete(null);
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
          {!isHydrated && (
              <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
          )}

          {isHydrated && sortedStations.length === 0 && (
             <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                <ServerCrash className="h-10 w-10 mb-4" />
                <p className="font-semibold text-lg">No Stations Found</p>
                <p className="text-sm">Click "Restore Defaults" to create 5 default stations or "Add Station" to create one manually.</p>
            </div>
          )}

          {isHydrated && sortedStations.map(station => (
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
                  <div>
                      <Label className="text-sm font-medium mb-2 block">Rendered Service</Label>
                      <Select
                          value={station.serviceId || 'null'}
                          onValueChange={(value) => handleServiceChange(station.id, value)}
                          disabled={isLoadingSettings || !settings?.services || settings.services.length === 0}
                      >
                          <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a service..." />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="null">
                                  <span className="text-muted-foreground">-- Not Assigned --</span>
                              </SelectItem>
                              {settings?.services?.map(service => (
                                  <SelectItem key={service.id} value={service.id}>
                                      {service.label}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
          ))}
        </CardContent>
        <CardFooter className="border-t pt-6 flex flex-col sm:flex-row gap-2">
            <Button className="w-full" onClick={handleAddStation} disabled={!isHydrated}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Station
            </Button>
            <Button variant="outline" className="w-full" onClick={handleRestoreDefaults} disabled={!isHydrated}>
                <RefreshCw className="mr-2 h-4 w-4" /> Restore Defaults
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
    </>
  );
}
