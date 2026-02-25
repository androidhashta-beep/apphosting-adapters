
'use client';

import { useRouter } from 'next/navigation';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase/provider';
import { collection } from 'firebase/firestore';
import type { Station } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useUserProfile } from '@/hooks/useUserProfile';

const APP_ROLE_KEY = 'app-instance-role';
const APP_STATION_KEY = 'app-instance-station-id';

export function StationSelectorClient() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { profile } = useUserProfile();
  
  const stationsCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'stations') : null), [firestore]);
  const { data: stations, isLoading: isLoadingStations } = useCollection<Station>(stationsCollectionRef);

  const handleStationSelect = (station: Station) => {
    localStorage.setItem(APP_ROLE_KEY, 'staff');
    localStorage.setItem(APP_STATION_KEY, station.id);
    router.push(`/station/${station.id}`);
  };

  const sortedStations = stations?.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })) || [];

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Which Station is This?</CardTitle>
          <CardDescription>
            Select the station this device will be used for. This setting will be saved, and the device will automatically open to this station's control panel in the future.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingStations ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedStations.map((station) => (
                <Button
                  key={station.id}
                  variant="outline"
                  className="h-24 justify-start p-4 text-left"
                  onClick={() => handleStationSelect(station)}
                >
                  <Monitor className="mr-4 h-6 w-6 flex-shrink-0 text-primary" />
                  <span className="font-semibold text-lg">{station.name}</span>
                </Button>
              ))}
            </div>
          )}
          {(profile?.role === 'admin' || profile?.role === 'staff') && (
             <div className="text-center pt-4">
                <Button variant="link" asChild>
                    <Link href="/staff">Or, view the full staff dashboard</Link>
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
