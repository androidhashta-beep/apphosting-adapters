import type { Metadata } from 'next';
import './globals.css';
import { QueueProvider } from '@/contexts/QueueProvider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Renaissance Training Center Inc.',
  description: 'A smart queueing system for Renaissance Training Center Inc.',
  icons: {
    icon: 'https://irp.cdn-website.com/39392137/dms3rep/multi/opt/logo-6f4e825a-396w.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <QueueProvider>
          {children}
          <Toaster />
        </QueueProvider>
      </body>
    </html>
  );
}
