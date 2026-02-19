'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonitorPlay, Ticket, UsersRound, BrainCircuit, Loader2 } from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';

const APP_ROLE_KEY = 'app-instance-role';

type Role = 'kiosk' | 'display' | 'staff' | 'admin';

const roles = [
    {
        id: 'kiosk' as Role,
        title: 'Ticket Kiosk',
        description: 'For students to get a queue number.',
        icon: Ticket,
    },
    {
        id: 'display' as Role,
        title: 'Public Display',
        description: 'Shows the current queue status on a public screen.',
        icon: MonitorPlay,
    },
    {
        id: 'staff' as Role,
        title: 'Staff Dashboard',
        description: 'For staff to manage queues and call tickets.',
        icon: UsersRound,
    },
    {
        id: 'admin' as Role,
        title: 'Admin Panel',
        description: 'For administrators to configure stations.',
        icon: BrainCircuit,
    }
];

export default function RoleSelectorPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const hasDecidedToShowSelector = useRef(false);

    useEffect(() => {
        if (hasDecidedToShowSelector.current) {
            setIsLoading(false);
            return;
        }

        const shouldShowSelector = sessionStorage.getItem('force-role-selection');
        if (shouldShowSelector) {
            sessionStorage.removeItem('force-role-selection');
            hasDecidedToShowSelector.current = true;
            setIsLoading(false); // Show the selector
            return;
        }

        const savedRole = localStorage.getItem(APP_ROLE_KEY);
        if (savedRole && roles.some(r => r.id === savedRole)) {
            router.replace(`/${savedRole}`);
        } else {
            // If no role is saved, default to staff dashboard.
            localStorage.setItem(APP_ROLE_KEY, 'staff');
            router.replace('/staff');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRoleSelect = (role: Role) => {
        localStorage.setItem(APP_ROLE_KEY, role);
        router.push(`/${role}`);
    };
    
    if (isLoading) {
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
                            Please choose the primary function for this device. This setting will be saved.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {roles.map((role) => (
                            <Button
                                key={role.id}
                                variant="outline"
                                className="h-auto justify-start p-6 text-left"
                                onClick={() => handleRoleSelect(role.id)}
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
                <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>To change this setting later, you will need to clear the application's stored data.</p>
                </div>
            </div>
        </PageWrapper>
    );
}
