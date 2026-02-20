import { Timestamp } from "firebase/firestore";

export type Service = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export type ImagePlaceholder = {
  id:string;
  description: string;
  imageUrl: string;
  imageHint: string;
  type: 'image' | 'video';
  useOwnAudio?: boolean;
};

export type AudioTrack = {
    id: string;
    description: string;
    url: string;
};

export type Settings = {
  companyName: string;
  services: Service[];
  placeholderImages: ImagePlaceholder[];
  backgroundMusic: AudioTrack[];
};

export type TicketType = string;

export type TicketStatus = 'waiting' | 'serving' | 'served' | 'skipped';

export type Ticket = {
  id: string;
  ticketNumber: string;
  type: TicketType;
  status: TicketStatus;
  createdAt: Timestamp;
  servedBy?: string; // stationId
  calledAt?: Timestamp | null;
  servedAt?: Timestamp | null;
};

export type StationStatus = 'open' | 'closed';
export type StationType = string;

export type Station = {
  id: string;
  name: string;
  serviceIds: string[];
  status: StationStatus;
  currentTicketId?: string | null;
};
