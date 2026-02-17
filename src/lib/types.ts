export type TicketType = 'counter' | 'cashier' | 'certificate';

export type TicketStatus = 'waiting' | 'serving' | 'served' | 'skipped';

export type Ticket = {
  id: string;
  ticketNumber: string;
  type: TicketType;
  status: TicketStatus;
  createdAt: number;
  servedBy?: string; // stationId
  calledAt?: number;
  servedAt?: number;
};

export type StationStatus = 'open' | 'closed';
export type StationMode = 'regular' | 'all-in-one';
export type StationType = 'counter' | 'cashier' | 'certificate';

export type Station = {
  id: string;
  name: string;
  type: StationType;
  status: StationStatus;
  mode: StationMode;
  currentTicketId?: string | null;
};
