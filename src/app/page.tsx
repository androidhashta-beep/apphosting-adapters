import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Ticket,
  MonitorPlay,
  UsersRound,
  BrainCircuit,
  ArrowRight,
} from 'lucide-react';

const menuItems = [
  {
    href: '/kiosk',
    icon: Ticket,
    title: 'Ticket Kiosk',
    description: 'Students can generate queue tickets here.',
  },
  {
    href: '/display',
    icon: MonitorPlay,
    title: 'Public Display',
    description: 'Real-time view of serving and waiting tickets.',
  },
  {
    href: '/staff',
    icon: UsersRound,
    title: 'Staff Dashboard',
    description: 'Manage queues and serve students.',
  },
  {
    href: '/admin',
    icon: BrainCircuit,
    title: 'Admin Panel',
    description: 'Configure stations and get AI suggestions.',
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="bg-primary shadow-lg">
        <div className="container mx-auto flex h-20 items-center justify-center px-4 md:h-24 md:justify-start">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary-foreground tracking-tight md:text-3xl">
              Renaissance Training Center Inc.
            </h1>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
          <div className="text-center mb-12">
            <p className="mt-2 text-muted-foreground">
              Select an option to get started.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {menuItems.map((item) => (
              <Link href={item.href} key={item.href} className="group">
                <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50">
                  <CardHeader className="flex flex-row items-center gap-4 pb-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {item.title}
                      </CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm font-medium text-primary">
                      Go to {item.title}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <footer className="py-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Renaissance Training Center Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
