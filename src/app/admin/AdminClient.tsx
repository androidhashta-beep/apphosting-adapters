'use client';

import { useState, useEffect } from 'react';
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
import { Trash2, ArrowLeft, PlusCircle } from 'lucide-react';
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
import { collection, doc } from 'firebase/firestore';
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

  const stationsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'stations') : null),
    [firestore]
  );
  const { data: stations, isLoading: isLoadingStations } =
    useCollection<Station>(stationsCollection);

  const [stationToDelete, setStationToDelete] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || '');
    }
  }, [settings]);

  // One-time effect to ensure core services exist
  useEffect(() => {
    if (settingsRef && !isLoadingSettings && firestore) {
      const currentServices = settings?.services ? JSON.parse(JSON.stringify(settings.services)) : [];
      let needsUpdate = false;
  
      const ensureService = (id: string, label: string, description: string, icon: string) => {
        if (!currentServices.some((s: Service) => s.id === id)) {
          currentServices.push({ id, label, description, icon });
          needsUpdate = true;
        }
      };
  
      ensureService('registration', 'Registration', 'Student registration services.', 'UserPlus');
      ensureService('payment', 'Cashier', 'Payment and cashiering services.', 'DollarSign');
      ensureService('certificate', 'Certificate Claiming', 'Claiming of certificates.', 'Award');
  
      if (needsUpdate) {
        setDocumentNonBlocking(settingsRef, { services: currentServices }, { merge: true });
      }
    }
  }, [settings, isLoadingSettings, settingsRef, firestore]);
  
  // One-time effect to create default stations if none exist
  useEffect(() => {
    if (firestore && !isLoadingStations && stations?.length === 0 && stationsCollection && settings?.services && settings.services.length > 0) {
      const defaultStations = ['Window 1', 'Window 2', 'Window 3', 'Window 4'];
      const allServiceIds = settings.services.map(s => s.id);
      
      defaultStations.forEach(name => {
        const newStation: Omit<Station, 'id'> = {
          name: name,
          services: allServiceIds,
          status: 'closed',
          currentTicketId: null,
        };
        addDocumentNonBlocking(stationsCollection, newStation);
      });
    }
  }, [firestore, isLoadingStations, stations, stationsCollection, settings]);


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
  
    let updatedServices: string[];
    if (isAssigned) {
      updatedServices = [...currentStation.services, serviceId];
    } else {
      updatedServices = currentStation.services.filter(id => id !== serviceId);
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
    if (!stationsCollection || !stations || !settings?.services) {
      toast({
        variant: 'destructive',
        title: 'Cannot Add Station',
        description:
          'System is not ready. Please wait a moment and try again.',
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
            <CardHeader className='flex-row items-center justify-between border-b'>
              <div>
                  <CardTitle>Station Management</CardTitle>
                  <CardDescription className="mt-1">
                    Configure stations and the services they provide.
                  </CardDescription>
              </div>
              <Button onClick={handleAutoAddStation}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Station
              </Button>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {!isHydrated &&
                [...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-[260px] w-full" />
                ))}
              {isHydrated && stations?.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-10">
                  <p>No stations configured. Default stations will be created shortly.</p>
                </div>
              )}
              {isHydrated &&
                stations?.map((station) => {
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
    </div>
  );
}
