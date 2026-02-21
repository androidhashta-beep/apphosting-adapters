'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex w-full items-center justify-between">
      <span className="text-xl font-bold">{format(time, 'EEEE, MMMM d, yyyy')}</span>
      <span className="text-2xl font-extrabold">{format(time, 'hh:mm:ss a')}</span>
    </div>
  );
}
