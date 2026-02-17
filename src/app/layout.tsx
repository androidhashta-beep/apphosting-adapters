import type { Metadata } from 'next';
import './globals.css';
import { QueueProvider } from '@/contexts/QueueProvider';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Renaissance Training Center Inc.',
  description: 'A smart queueing system for Renaissance Training Center Inc.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueueProvider>
            {children}
            <Toaster />
          </QueueProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
