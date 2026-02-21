'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, UsersRound, BrainCircuit, Loader2, Monitor } from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';
import { useUser } from '@/firebase';

const APP_ROLE_KEY = 'app-instance-role';

type Role = 'kiosk' | 'staff' | 'admin' | 'display';

const roles = [
    {
        id: 'display' as Role,
        title: 'Public Display',
        description: 'Shows tickets being served on a public screen.',
        icon: Monitor,
    },
    {
        id: 'kiosk' as Role,
        title: 'Ticket Kiosk',
        description: 'For students to get a queue number.',
        icon: Ticket,
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
        description: 'For administrators to configure stations and users.',
        icon: BrainCircuit,
    }
];

export default function RoleSelectorPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
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
            setIsLoading(false); // Show the selector
            return;
        }

        const savedRole = localStorage.getItem(APP_ROLE_KEY) as Role | null;

        if (savedRole && roles.some(r => r.id === savedRole)) {
            // If user is anonymous and trying to access a protected role, go to login.
            if ((savedRole === 'admin' || savedRole === 'staff') && user?.isAnonymous) {
                router.replace('/login');
                return;
            }
             if ((savedRole === 'admin' || savedRole === 'staff') && !user) {
                router.replace('/login');
                return;
            }
            router.replace(`/${savedRole}`);
        } else {
             hasDecidedToShowSelector.current = true;
             setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isUserLoading, user]);

    const handleRoleSelect = (role: Role) => {
        localStorage.setItem(APP_ROLE_KEY, role);
         if ((role === 'admin' || role === 'staff') && (user?.isAnonymous || !user)) {
            router.push('/login');
        } else {
            router.push(`/${role}`);
        }
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
                    <p>You can return to this screen by clicking the "Home" or "Back" buttons.</p>
                </div>
            </div>
        </PageWrapper>
    );
}
