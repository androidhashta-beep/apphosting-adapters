import type { Station } from './types';

export const initialStations: Station[] = [
  { id: 'enrollment-1', name: 'Enrollment Counter 1', type: 'enrollment', status: 'open', mode: 'regular', currentTicketId: null },
  { id: 'payment-1', name: 'Cashier', type: 'payment', status: 'open', mode: 'regular', currentTicketId: null },
];
