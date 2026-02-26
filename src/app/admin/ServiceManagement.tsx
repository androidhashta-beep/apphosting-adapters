
'use client';

import { useState, useMemo } from 'react';
import type { Settings, Service } from '@/lib/types';
import { useFirebase, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, runTransaction } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, PlusCircle, Loader2, Edit } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon, iconList } from '@/lib/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const handleFirestoreError = (error: any, toast: any, operation: string) => {
    let title;
    let description;

    if (error.code === 'unavailable' || error.code === 'network-request-failed') {
        title = "CRITICAL: Connection Blocked by Firewall";
        description = "The application cannot connect to the local database because your PC's firewall is blocking it. Please allow the app through your firewall to continue.";
    } else if (error.code === 'permission-denied') {
        title = 'Permission Denied';
        description = 'You do not have permission to perform this action. Check your security rules.';
    } else {
        title = `Operation Failed: ${operation}`;
        description = 'An unexpected error occurred. Please try again.';
    }
    toast({
        variant: 'destructive',
        title: title,
        description: description,
        duration: 20000,
    });
};

export function ServiceManagement() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'app') : null),
    [firestore]
  );
  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [serviceLabel, setServiceLabel] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceIcon, setServiceIcon] = useState('');

  const openAddDialog = () => {
    setEditingService(null);
    setServiceLabel('');
    setServiceDescription('');
    setServiceIcon('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setServiceLabel(service.label);
    setServiceDescription(service.description);
    setServiceIcon(service.icon);
    setIsDialogOpen(true);
  };
  
  const handleDataUpdate = async (updateFn: (currentSettings: Settings | null) => Partial<Settings>) => {
    if (!firestore || !settingsRef) return;
    setIsSaving(true);
    try {
      await runTransaction(firestore, async (transaction) => {
        const settingsDoc = await transaction.get(settingsRef);
        const currentData = settingsDoc.exists() ? (settingsDoc.data() as Settings) : null;
        const updatedData = updateFn(currentData);
        
        if (settingsDoc.exists()) {
          transaction.update(settingsRef, updatedData);
        } else {
          transaction.set(settingsRef, updatedData);
        }
      });
      toast({
        title: 'Settings Updated',
        description: 'Your changes have been saved.',
      });
    } catch (error: any) {
        handleFirestoreError(error, toast, 'Update Services');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveService = async () => {
    if (!serviceLabel.trim() || !serviceIcon) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a label and select an icon.' });
      return;
    }
    
    await handleDataUpdate((currentSettings) => {
        const currentServices = currentSettings?.services || [];
        if (editingService) {
            // Update existing service
            const updatedServices = currentServices.map(s => s.id === editingService.id ? { ...s, label: serviceLabel, description: serviceDescription, icon: serviceIcon } : s);
            return { services: updatedServices };
        } else {
            // Add new service
            const newService: Service = {
                id: serviceLabel.toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`,
                label: serviceLabel,
                description: serviceDescription,
                icon: serviceIcon,
            };
            return { services: [...currentServices, newService] };
        }
    });

    setIsDialogOpen(false);
  };

  const handleDeleteService = async (serviceId: string) => {
    await handleDataUpdate((currentSettings) => {
        const updatedServices = (currentSettings?.services || []).filter(s => s.id !== serviceId);
        return { services: updatedServices };
    });
  };

  const isLoading = isLoadingSettings || isSaving;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Service Management</CardTitle>
          <CardDescription>
            Add or remove the services that users can select at the kiosk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-60">
            <div className="space-y-2 pr-4">
              {isLoading && (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              )}
              {!isLoading && settings?.services?.map((service) => (
                <div key={service.id} className="flex items-center gap-2 p-2 border rounded-lg bg-background">
                  <Icon name={service.icon} className="h-6 w-6 text-muted-foreground" />
                  <div className="flex-grow">
                    <p className="font-semibold">{service.label}</p>
                    <p className="text-xs text-muted-foreground">{service.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(service)}
                      disabled={isSaving}
                      aria-label="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteService(service.id)}
                      disabled={isSaving}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {!isLoading && (!settings?.services || settings.services.length === 0) && (
                <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground">
                  <p>No services added yet.</p>
                  <p className="text-xs">Click "Add Service" to get started.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <Button onClick={openAddDialog} disabled={isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Service
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            <DialogDescription>
              Fill in the details for the service. This will appear on the kiosk screen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service-label" className="text-right">Label</Label>
              <Input
                id="service-label"
                value={serviceLabel}
                onChange={(e) => setServiceLabel(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Registration"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service-desc" className="text-right">Description</Label>
              <Input
                id="service-desc"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                className="col-span-3"
                placeholder="e.g., For new students"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service-icon" className="text-right">Icon</Label>
              <Select value={serviceIcon} onValueChange={setServiceIcon}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an icon..." />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {iconList.map(iconName => (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <Icon name={iconName} className="h-4 w-4" />
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleSaveService}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
