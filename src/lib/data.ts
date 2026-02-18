import type { Station } from './types';

export const initialStations: Station[] = [
  { id: 'enrollment-1', name: 'Enrollment Counter 1', type: 'enrollment', status: 'open', mode: 'regular' },
  { id: 'enrollment-2', name: 'Enrollment Counter 2', type: 'enrollment', status: 'open', mode: 'regular' },
  { id: 'enrollment-3', name: 'Enrollment Counter 3', type: 'enrollment', status: 'closed', mode: 'regular' },
  { id: 'payment-1', name: 'Payment Counter', type: 'payment', status: 'open', mode: 'regular' },
];
