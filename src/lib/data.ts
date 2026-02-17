import type { Station } from './types';

export const initialStations: Station[] = [
  { id: 'counter-1', name: 'Counter 1', type: 'counter', status: 'open', mode: 'regular' },
  { id: 'counter-2', name: 'Counter 2', type: 'counter', status: 'open', mode: 'regular' },
  { id: 'counter-3', name: 'Counter 3', type: 'counter', status: 'closed', mode: 'regular' },
  { id: 'cashier-1', name: 'Cashier', type: 'cashier', status: 'open', mode: 'regular' },
];
