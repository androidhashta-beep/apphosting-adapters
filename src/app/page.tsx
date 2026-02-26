'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, UsersRound, Loader2, Monitor } from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';
import { useUser } from '@/firebase/provider';

const APP_ROLE_KEY = 'app-instance-role';
const APP_STATION_KEY = 'app-instance-station-id';

type Role = 'kiosk' | 'staff' | 'display';

const roles: { id: Role; title: string; description: string; icon: React.FC<any>, path: string }[] = [
    {
        id: 'display' as Role,
        title: 'Public Display',
        description: 'Shows tickets being served on a public screen.',
        icon: Monitor,
        path: '/display',
    },
    {
        id: 'kiosk' as Role,
        title: 'Ticket Kiosk',
        description: 'For students to get a queue number.',
        icon: Ticket,
        path: '/kiosk',
    },
    {
        id: 'staff' as Role,
        title: 'Staff Station',
        description: 'Set this device up to control a specific service station.',
        icon: UsersRound,
        path: '/station-selector',
    },
];

export default function RoleSelectorPage() {
    const router = useRouter();
    const { isUserLoading } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const hasDecidedToShowSelector = useRef(false);

    useEffect(() => {
        if (isUserLoading) {
            return;
        }

        if (hasDecidedToShowSelector.current) {
            setIsLoading(false);
            return;
        }

        const shouldShowSelector = sessionStorage.getItem('force-role-selection');
        if (shouldShowSelector) {
            sessionStorage.removeItem('force-role-selection');
            hasDecidedToShowSelector.current = true;
            setIsLoading(false);
            return;
        }
        
        const savedStationId = localStorage.getItem(APP_STATION_KEY);
        if (savedStationId) {
             router.replace(`/station/${savedStationId}`);
             return;
        }

        const savedRole = localStorage.getItem(APP_ROLE_KEY) as Role | null;
        const roleConfig = roles.find(r => r.id === savedRole);

        if (roleConfig) {
             router.replace(roleConfig.path);
        } else {
             hasDecidedToShowSelector.current = true;
             setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isUserLoading]);

    const handleRoleSelect = (role: Role, path: string) => {
        // For staff, we don't save the role, as the station-selector will handle it.
        if (role !== 'staff') {
            localStorage.setItem(APP_ROLE_KEY, role);
        }
        router.push(path);
    };
    
    if (isLoading || isUserLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Application...</p>
            </div>
        );
    }

    return (
        <PageWrapper title="Device Role Setup" showBackButton={false}>
            <div className="flex flex-col items-center justify-center">
                <Card className="w-full max-w-4xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Select This Device's Role</CardTitle>
                        <CardDescription>
                            Please choose the primary function for this device. This setting will be saved for this browser.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {roles.map((role) => (
                            <Button
                                key={role.id}
                                variant="outline"
                                className="h-auto justify-start p-6 text-left"
                                onClick={() => handleRoleSelect(role.id, role.path)}
                            >
                                <role.icon className="mr-4 h-8 w-8 flex-shrink-0 text-primary" />
                                <div className="flex flex-col">
                                    <p className="font-bold text-lg">{role.title}</p>
                                    <p className="text-sm text-muted-foreground whitespace-normal">{role.description}</p>
                                </div>
                            </Button>
                            ))}
                    </CardContent>
                </Card>
            </div>
        </PageWrapper>
    );
}
