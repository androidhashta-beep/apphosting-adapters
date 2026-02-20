'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { StationMode, Station, Service, Settings } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trash2,
  RefreshCw,
  ArrowLeft,
  Download,
  Upload,
  PlusCircle,
  Edit,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Icon, iconList } from '@/lib/icons';
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

  const [newStationName, setNewStationName] = useState('');
  const [newStationType, setNewStationType] = useState<string>('');

  const [stationToDelete, setStationToDelete] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');

  const [isServiceEditorOpen, setIsServiceEditorOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName);
      if (settings.services?.length > 0 && !newStationType) {
        setNewStationType(settings.services[0].id);
      }
    }
  }, [settings, newStationType]);

  useEffect(() => {
    if (settings && settingsRef && !isLoadingSettings && firestore) {
      let services = settings.services ? JSON.parse(JSON.stringify(settings.services)) : [];
      let needsUpdate = false;

      const ensureService = (
        id: string,
        label: string,
        description: string,
        icon: string,
        forceLabel: boolean = false
      ) => {
        let service = services.find((s: Service) => s.id === id);
        if (!service) {
          services.push({ id, label, description, icon });
          needsUpdate = true;
        } else if (forceLabel && service.label !== label) {
          service.label = label;
          service.description = description;
          service.icon = icon;
          needsUpdate = true;
        }
      };

      ensureService('enrollment', 'Enrollment', 'Student enrollment services.', 'UserPlus');
      ensureService('payment', 'Cashier', 'Payment and cashiering services.', 'DollarSign', true);
      ensureService('certificate', 'Certificate Claiming', 'Claiming of certificates.', 'Award');

      if (needsUpdate) {
        setDocumentNonBlocking(settingsRef, { services: services }, { merge: true });
      }
    }
  }, [settings, isLoadingSettings, settingsRef, firestore]);

  const handleGoHome = () => {
    localStorage.removeItem('app-instance-role');
    sessionStorage.setItem('force-role-selection', 'true');
    router.push('/');
  };

  const handleModeChange = (stationId: string, mode: StationMode) => {
    if (!firestore) return;
    const stationRef = doc(firestore, 'stations', stationId);
    updateDocumentNonBlocking(stationRef, { mode });
  };

  const handleStatusChange = (stationId: string, checked: boolean) => {
    if (!firestore) return;
    const stationRef = doc(firestore, 'stations', stationId);
    const newStatus = checked ? 'open' : 'closed';
    updateDocumentNonBlocking(stationRef, { status: newStatus });
  };

  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim() || !newStationType || !stationsCollection) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a station name and select a type.',
      });
      return;
    }
    const newStation: Omit<Station, 'id'> = {
      name: newStationName,
      type: newStationType,
      status: 'closed',
      mode: 'regular',
      currentTicketId: null,
    };
    addDocumentNonBlocking(stationsCollection, newStation);
    setNewStationName('');
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

  const handleSaveService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings || !settingsRef) return;

    const formData = new FormData(e.currentTarget);
    const id = formData.get('id') as string;
    const label = formData.get('label') as string;
    const description = formData.get('description') as string;
    const icon = formData.get('icon') as string;

    if (!id || !label || !description || !icon) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all fields for the service.',
      });
      return;
    }

    const service: Service = {
      id: id.toLowerCase().replace(/\s+/g, '-'),
      label,
      description,
      icon,
    };

    let services = [...(settings.services || [])];
    if (editingService) {
      const index = services.findIndex((s) => s.id === editingService.id);
      if (index > -1) services[index] = service;
    } else {
      if (services.some((s) => s.id === service.id)) {
        toast({
          variant: 'destructive',
          title: 'ID already exists',
          description: `Service ID "${service.id}" is already in use. Please choose a unique label.`,
        });
        return;
      }
      services.push(service);
    }

    setDocumentNonBlocking(settingsRef, { services }, { merge: true });
    toast({
      title: 'Service Saved',
      description: `Service "${label}" has been saved.`,
    });
    setIsServiceEditorOpen(false);
    setEditingService(null);
  };

  const openServiceEditor = (service: Service | null) => {
    setEditingService(service);
    setIsServiceEditorOpen(true);
  };

  const handleDeleteService = () => {
    if (serviceToDelete && settingsRef && settings) {
      const updatedServices = (settings.services || []).filter(
        (s) => s.id !== serviceToDelete.id
      );
      setDocumentNonBlocking(
        settingsRef,
        { services: updatedServices },
        { merge: true }
      );

      // Also remove stations of this type
      stations?.forEach((station) => {
        if (station.type === serviceToDelete.id && firestore) {
          const stationRef = doc(firestore, 'stations', station.id);
          deleteDocumentNonBlocking(stationRef);
        }
      });

      toast({
        title: 'Service Removed',
        description: `Service "${serviceToDelete.label}" and its associated stations have been removed.`,
      });
      setServiceToDelete(null);
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
        <div className="grid grid-cols-1 items-start gap-8 p-6 lg:grid-cols-2">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>
                  Set the name of your organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
            <Card>
              <CardHeader>
                <CardTitle>Service Types</CardTitle>
                <CardDescription>
                  Manage the services offered at the kiosk.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isHydrated &&
                  settings?.services?.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 rounded-md border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          name={service.icon}
                          className="h-5 w-5 text-muted-foreground"
                        />
                        <div>
                          <p className="font-semibold">{service.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openServiceEditor(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setServiceToDelete(service)}
                          disabled={(settings?.services?.length ?? 0) <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openServiceEditor(null)}
                >
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
                      onValueChange={(value: string) => setNewStationType(value)}
                      disabled={!isHydrated}
                    >
                      <SelectTrigger id="new-station-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings?.services?.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={!isHydrated}>
                    Add Station
                  </Button>
                </form>
              </CardContent>
            </Card>
            <CarouselSettings />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Station Management</CardTitle>
              <CardDescription>
                Configure station status and operational modes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isHydrated &&
                [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md border h-[180px]"
                  >
                    <Skeleton className="h-full w-full" />
                  </div>
                ))}
              {isHydrated &&
                stations?.map((station) => {
                  const isServing = !!station.currentTicketId;
                  const isClosed = station.status === 'closed';
                  const isDeleteDisabled = isServing && !isClosed;
                  const serviceType =
                    settings?.services?.find((s) => s.id === station.type)
                      ?.label || station.type;

                  return (
                    <div
                      key={station.id}
                      className="space-y-3 rounded-md border p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{station.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {serviceType}
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
                      <div className="space-y-2">
                        <Label>Operational Mode</Label>
                        <Select
                          value={station.mode}
                          onValueChange={(value: StationMode) =>
                            handleModeChange(station.id, value)
                          }
                          disabled={isClosed}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="all-in-one">
                              All-in-One
                            </SelectItem>
                            <SelectItem value="payment-only">
                              Payment-only (Legacy)
                            </SelectItem>
                            <SelectItem value="certificate-only">
                              Certificate-only (Legacy)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
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
        </div>
      </ScrollArea>

      {/* Dialogs */}
      <AlertDialog
        open={isServiceEditorOpen}
        onOpenChange={setIsServiceEditorOpen}
      >
        <AlertDialogContent>
          <form onSubmit={handleSaveService}>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service-label">Label</Label>
                <Input
                  id="service-label"
                  name="label"
                  defaultValue={editingService?.label}
                  placeholder="e.g. Enrollment"
                  required
                />
                <Input
                  id="service-id"
                  name="id"
                  defaultValue={
                    editingService?.id ||
                    editingService?.label.toLowerCase().replace(/\s+/g, '-') ||
                    ''
                  }
                  type="hidden"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-description">Description</Label>
                <Textarea
                  id="service-description"
                  name="description"
                  defaultValue={editingService?.description}
                  placeholder="A short description for the kiosk screen."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-icon">Icon</Label>
                <Select
                  name="icon"
                  defaultValue={editingService?.icon || iconList[0]}
                >
                  <SelectTrigger id="service-icon">
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconList.map((iconName) => (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <Icon name={iconName} className="h-4 w-4" />
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This icon will be shown on the kiosk button.
                </p>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                type="button"
                onClick={() => setIsServiceEditorOpen(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction type="submit">Save Service</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

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
        open={!!serviceToDelete}
        onOpenChange={(open) => !open && setServiceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{serviceToDelete?.label}" service
              and any stations assigned to it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setServiceToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
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
