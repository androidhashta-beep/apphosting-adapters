import type { Timestamp } from "firebase/firestore";

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

export type StationStatus = 'open' | 'closed';
export type StationType = string;

export type Station = {
  id: string;
  name: string;
  serviceIds: string[];
  status: StationStatus;
  currentTicketId?: string | null;
};

export type DefaultConfiguration = {
    services: Service[];
    stations: Station[];
};

export type Settings = {
  companyName: string;
  companyLogoUrl?: string;
  services: Service[];
  placeholderImages: ImagePlaceholder[];
  backgroundMusic: AudioTrack[];
  backgroundMusicVolume?: number;
  defaultConfiguration?: DefaultConfiguration;
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

export type UserRole = 'admin' | 'staff';

export type UserProfile = {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
};
