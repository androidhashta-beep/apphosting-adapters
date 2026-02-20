'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Station, Service, Settings } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft, PlusCircle, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useToast } from '@/hooks/use-toast';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  useCollection,
  useDoc,
  useFirebase,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { CarouselSettings } from './CarouselSettings';

export function AdminClient() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'app') : null),
    [firestore]
  );
  const { data: settings, isLoading: isLoadingSettings } =
    useDoc<Settings>(settingsRef);
    
  const hasAttemptedServiceRestore = useRef(false);

  const stationsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'stations') : null),
    [firestore]
  );
  const { data: stations, isLoading: isLoadingStations } =
    useCollection<Station>(stationsCollection);
    
  const sortedStations = useMemo(() => {
    if (!stations) return [];
    return [...stations].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
  }, [stations]);

  const [stationToDelete, setStationToDelete] = useState<string | null>(null);
  const [restoreDefaultsDialog, setRestoreDefaultsDialog] = useState(false);

  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || '');
    }
  }, [settings]);

  useEffect(() => {
    if (
      !isLoadingSettings &&
      settings &&
      (!settings.services || settings.services.length === 0) &&
      settingsRef &&
      !hasAttemptedServiceRestore.current
    ) {
      hasAttemptedServiceRestore.current = true; 

      const defaultServices: Service[] = [
        { id: 'registration', label: 'Registration', description: 'Register for courses and training programs.', icon: 'UserPlus' },
        { id: 'payment', label: 'Cashier', description: 'Pay for services, courses, and other fees.', icon: 'DollarSign' },
        { id: 'certificate', label: 'Certificate Claiming', description: 'Claim your certificates and other documents.', icon: 'Award' },
      ];
      
      setDocumentNonBlocking(settingsRef, { services: defaultServices }, { merge: true });
      
      toast({
        title: "Default Services Restored",
        description: "The standard services have been added to your configuration.",
      });
    }
  }, [settings, isLoadingSettings, settingsRef, toast]);

  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };

  const handleServiceAssignmentChange = (stationId: string, serviceId: string, isAssigned: boolean) => {
    if (!firestore || !stations) return;
    const stationRef = doc(firestore, 'stations', stationId);
    const currentStation = stations.find(s => s.id === stationId);
    if (!currentStation) return;
  
    const currentServices = currentStation.services || [];
    let updatedServices: string[];
    if (isAssigned) {
      updatedServices = [...currentServices, serviceId];
    } else {
      updatedServices = currentServices.filter(id => id !== serviceId);
    }
    updateDocumentNonBlocking(stationRef, { services: updatedServices });
  };

  const handleStatusChange = (stationId: string, checked: boolean) => {
    if (!firestore) return;
    const stationRef = doc(firestore, 'stations', stationId);
    const newStatus = checked ? 'open' : 'closed';
    updateDocumentNonBlocking(stationRef, { status: newStatus });
  };

  const handleAutoAddStation = () => {
    if (!stationsCollection || !stations) {
      toast({
        variant: 'destructive',
        title: 'Cannot Add Station',
        description: 'System is not ready. Please wait for data to load.',
      });
      return;
    }

    if (!settings?.services || settings.services.length === 0) {
      const description =
        !settings && !isLoadingSettings
          ? "Application settings are missing. Please use 'Restore Defaults' first."
          : 'No services are configured. Please add a service or use "Restore Defaults" to add them.';
      
      toast({
          variant: "destructive",
          title: "Cannot Add Station",
          description: description,
      });
      return;
    }

    let maxNumber = 0;
    let namePrefix = 'Window';
    stations.forEach((station) => {
      const match = station.name.match(/^(Window|Counter)\s+(\d+)$/i);
      if (match) {
        const number = parseInt(match[2], 10);
        if (number > maxNumber) {
          maxNumber = number;
          namePrefix = match[1];
        }
      }
    });

    const newStationName = `${namePrefix} ${maxNumber + 1}`;
    const allServiceIds = settings.services.map((s) => s.id);

    const newStation: Omit<Station, 'id'> = {
      name: newStationName,
      services: allServiceIds,
      status: 'closed',
      currentTicketId: null,
    };

    addDocumentNonBlocking(stationsCollection, newStation);

    toast({
      title: 'Station Added',
      description: `${newStationName} has been created.`,
    });
  };

  const handleDeleteStation = () => {
    if (stationToDelete && firestore) {
      const stationRef = doc(firestore, 'stations', stationToDelete);
      deleteDocumentNonBlocking(stationRef);
      setStationToDelete(null);
    }
  };

  const handleCompanyNameSave = () => {
    if (settingsRef) {
      setDocumentNonBlocking(settingsRef, { companyName }, { merge: true });
      toast({
        title: 'Settings Saved',
        description: 'Company name has been updated.',
      });
    }
  };

  const handleRestoreDefaults = async () => {
    if (!firestore || !settingsRef || !stationsCollection) {
      toast({ title: 'System Not Ready', description: 'Please wait a moment and try again.', variant: 'destructive' });
      return;
    }
    setRestoreDefaultsDialog(false);
  
    try {
      // --- Services ---
      const currentServices = settings?.services || [];
      let servicesToUse: Service[];
  
      if (currentServices.length === 0) {
        const defaultServices: Service[] = [
          { id: 'registration', label: 'Registration', description: 'Register for courses and training programs.', icon: 'UserPlus' },
          { id: 'payment', label: 'Cashier', description: 'Pay for services, courses, and other fees.', icon: 'DollarSign' },
          { id: 'certificate', label: 'Certificate Claiming', description: 'Claim your certificates and other documents.', icon: 'Award' },
        ];
        await setDoc(settingsRef, { services: defaultServices }, { merge: true });
        servicesToUse = defaultServices;
      } else {
        servicesToUse = currentServices;
      }
      
      const serviceIds = servicesToUse.map(s => s.id);
  
      // --- Stations ---
      const defaultStationNames = ['Window 1', 'Window 2', 'Window 3', 'Window 4', 'Window 5'];
      const existingStationNames = new Set(stations?.map(s => s.name) || []);
      
      const stationsToAdd = defaultStationNames.filter(name => !existingStationNames.has(name));
  
      if (stationsToAdd.length > 0) {
        const creationPromises = stationsToAdd.map(name => {
            const newStation: Omit<Station, 'id'> = {
                name: name,
                services: serviceIds,
                status: 'closed',
                currentTicketId: null,
            };
            return addDoc(stationsCollection, newStation);
        });
        await Promise.all(creationPromises);
      }
  
      if (stationsToAdd.length > 0 || currentServices.length === 0) {
          toast({ title: "Defaults Restored", description: "Any missing default stations or services have been recreated." });
      } else {
          toast({ title: "Nothing to Restore", description: "All default stations and services are already present." });
      }
    } catch (error: any) {
      console.error("Error restoring defaults:", error);
      toast({
        variant: "destructive",
        title: "Restore Failed",
        description: "Could not connect to the server to restore settings. Please check your connection and try again.",
      });
    }
  };

  const isHydrated = !isLoadingSettings && !isLoadingStations;

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b">
        <div className="container relative mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </button>
          </div>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold md:text-xl whitespace-nowrap">
            Admin Panel
          </h1>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <ScrollArea className="flex-grow">
        <div className="space-y-8 p-6">
          <Card>
            <CardHeader className='flex-row flex-wrap items-center justify-between gap-4 border-b'>
              <div>
                  <CardTitle>Station Management</CardTitle>
                  <CardDescription className="mt-1">
                    Configure stations and the services they provide.
                  </CardDescription>
              </div>
              <div className='flex gap-2 flex-wrap'>
                <Button onClick={handleAutoAddStation}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Station
                </Button>
                 <Button onClick={() => setRestoreDefaultsDialog(true)} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore Defaults
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {!isHydrated &&
                [...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-[260px] w-full" />
                ))}
              {isHydrated && sortedStations.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-10">
                  <p>No stations configured.</p>
                  <p className="text-sm mt-2">Click "Restore Defaults" to create Window 1-5.</p>
                </div>
              )}
              {isHydrated &&
                sortedStations.map((station) => {
                  const isServing = !!station.currentTicketId;
                  const isClosed = station.status === 'closed';
                  const isDeleteDisabled = isServing && !isClosed;
                  const assignedServices = (station.services || [])
                    .map(
                      (serviceId) =>
                        settings?.services?.find((s) => s.id === serviceId)
                          ?.label
                    )
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <div
                      key={station.id}
                      className="space-y-4 rounded-md border p-4 flex flex-col"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{station.name}</p>
                          <p className="text-xs text-muted-foreground min-h-[2.5rem]">
                            {assignedServices || 'No services assigned'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setStationToDelete(station.id)}
                          className="text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed -mr-2 -mt-2 shrink-0"
                          disabled={isDeleteDisabled}
                          title={
                            isDeleteDisabled
                              ? 'Station is busy. Close it first.'
                              : 'Delete station'
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                      <div className="space-y-2 flex-grow">
                        <Label>Handled Services</Label>
                        <div className="space-y-1">
                          {settings?.services?.map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`service-${station.id}-${service.id}`}
                                checked={(station.services || []).includes(service.id)}
                                onCheckedChange={(checked) =>
                                  handleServiceAssignmentChange(
                                    station.id,
                                    service.id,
                                    !!checked
                                  )
                                }
                                disabled={isClosed}
                              />
                              <Label
                                htmlFor={`service-${station.id}-${service.id}`}
                                className="font-normal cursor-pointer text-sm"
                              >
                                {service.label}
                              </Label>
                            </div>
                          ))}
                           {(!settings || !settings.services || settings.services.length === 0) && (
                            <p className="text-xs text-muted-foreground pt-1">No services defined. Try restoring defaults.</p>
                           )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3 mt-auto">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor={`status-switch-${station.id}`}
                            className="cursor-pointer"
                          >
                            Station Status
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {isClosed
                              ? 'Station is offline.'
                              : 'Station is open for service.'}
                          </p>
                        </div>
                        <Switch
                          id={`status-switch-${station.id}`}
                          checked={!isClosed}
                          onCheckedChange={(checked) =>
                            handleStatusChange(station.id, checked)
                          }
                        />
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Company Settings</CardTitle>
                  <CardDescription>
                    Set the name of your organization.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={!isHydrated}
                  />
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCompanyNameSave} disabled={!isHydrated}>
                    Save
                  </Button>
                </CardFooter>
              </Card>
            </div>
            <div className="space-y-8">
              <CarouselSettings />
            </div>
          </div>
        </div>
      </ScrollArea>

      <AlertDialog
        open={!!stationToDelete}
        onOpenChange={(open) => !open && setStationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the station. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStationToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStation}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={restoreDefaultsDialog}
        onOpenChange={setRestoreDefaultsDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Default Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add any missing default stations (Window 1-5) and services (Registration, Payment, Certificate). It will NOT delete any stations or services you have created yourself.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreDefaults}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
