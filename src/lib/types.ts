export type Service = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export type Settings = {
  companyName: string;
  services: Service[];
};

export type TicketType = string;

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
export type StationMode = 'regular' | 'all-in-one' | 'payment-only' | 'certificate-only';
export type StationType = string;

export type Station = {
  id: string;
  name: string;
  type: StationType;
  status: StationStatus;
  mode: StationMode;
  currentTicketId?: string | null;
};

export type State = {
  tickets: Ticket[];
  stations: Station[];
  lastTicketTimestamp: number | null;
  settings: Settings;
};
