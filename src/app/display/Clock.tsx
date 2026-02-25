
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set time on the client to avoid hydration mismatch
    setTime(new Date());
    
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // On the server, and on the initial client render, `time` will be `null`.
  // We render a placeholder to prevent the hydration error and avoid layout shift.
  if (!time) {
    return (
       <div className="flex w-full items-center justify-between h-8">
         <div className="h-7 w-2/3 animate-pulse rounded-md bg-white/20" />
         <div className="h-8 w-1/4 animate-pulse rounded-md bg-white/20" />
       </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-between">
      <span className="text-xl font-bold">{format(time, 'EEEE, MMMM d, yyyy')}</span>
      <span className="text-2xl font-extrabold">{format(time, 'hh:mm:ss a')}</span>
    </div>
  );
}
