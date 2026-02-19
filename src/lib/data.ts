import type { Station } from './types';

export const initialStations: Station[] = [
  { id: 'enrollment-1', name: 'Counter 1', type: 'enrollment', status: 'open', mode: 'regular', currentTicketId: null },
  { id: 'enrollment-2', name: 'Counter 2', type: 'enrollment', status: 'open', mode: 'regular', currentTicketId: null },
  { id: 'payment-1', name: 'Cashier Window', type: 'payment', status: 'open', mode: 'regular', currentTicketId: null },
  { id: 'certificate-1', name: 'Certificates Window', type: 'certificate', status: 'open', mode: 'regular', currentTicketId: null },
];
