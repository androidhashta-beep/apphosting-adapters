'use client';

import { useState, useMemo } from 'react';
import { useFirebase, useDoc, useCollection, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, collection, arrayUnion, arrayRemove } from 'firebase/firestore';
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
import { Checkbox } from '@/components/ui/checkbox';

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
    if (!firestore) return;
    // Find the highest number in existing window names to avoid collisions
    const maxNum = stations?.reduce((max, s) => {
        const match = s.name.match(/(\d+)$/);
        if (match) {
            return Math.max(max, parseInt(match[1], 10));
        }
        return max;
    }, 0) || 0;

    const nextStationNumber = maxNum + 1;
    const newStationId = `window-${nextStationNumber}`;
    const newStationName = `Window ${nextStationNumber}`;
    
    const stationRef = doc(firestore, 'stations', newStationId);
    setDocumentNonBlocking(stationRef, {
        name: newStationName,
        status: 'closed',
        serviceIds: [],
    }, { merge: false });

    toast({ title: "Station Added", description: `Created station "${newStationName}".` });
  };
  
  const handleRestoreDefaults = () => {
      if (!firestore) return;

      toast({ title: "Restoring Defaults", description: "Applying default configuration..." });
      
      const defaultServices: Service[] = [
        { id: 'registration', label: 'Registration', description: 'Student registration process', icon: 'UserPlus' },
        { id: 'cashier', label: 'Cashier', description: 'Payment of fees', icon: 'DollarSign' },
        { id: 'certificate-claiming', label: 'Certificate Claiming', description: 'Claiming of certificates', icon: 'Award' },
        { id: 'information', label: 'Information', description: 'General inquiries', icon: 'HelpCircle' },
      ];
      
      const settingsDocRef = doc(firestore, 'settings', 'app');
      setDocumentNonBlocking(settingsDocRef, { services: defaultServices }, { merge: true });

      for (let i = 1; i <= 5; i++) {
        const stationId = `window-${i}`;
        const stationRef = doc(firestore, 'stations', stationId);
        setDocumentNonBlocking(stationRef, {
            name: `Window ${i}`,
            status: 'closed',
            serviceIds: [],
        }, { merge: false });
      }

      toast({
          title: "Defaults Restored",
          description: `Created 4 default services and 5 default stations.`
      });
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
  
  const handleServiceSelectionChange = (stationId: string, serviceId: string, isSelected: boolean) => {
    if (!firestore) return;
    const stationRef = doc(firestore, 'stations', stationId);
    
    updateDocumentNonBlocking(stationRef, {
      serviceIds: isSelected ? arrayUnion(serviceId) : arrayRemove(serviceId)
    });
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
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
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
                                          disabled={!isHydrated}
                                      />
                                      <Label htmlFor={`service-${station.id}-${service.id}`} className="font-normal cursor-pointer">
                                          {service.label}
                                      </Label>
                                  </div>
                              ))
                          ) : (
                              <p className="text-sm text-muted-foreground p-2">No services have been configured yet.</p>
                          )}
                      </div>
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
