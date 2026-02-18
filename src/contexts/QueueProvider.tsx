"use client";

import React, { createContext, useContext, useReducer, ReactNode, useMemo, useEffect, useState } from 'react';
import type { Station, Ticket, TicketType, StationStatus, StationMode, StationType as IStationType } from '@/lib/types';
import { initialStations } from '@/lib/data';

type State = {
  tickets: Ticket[];
  stations: Station[];
  lastTicketTimestamp: number | null;
};

type Action =
  | { type: 'ADD_TICKET'; payload: { ticket: Ticket } }
  | { type: 'UPDATE_STATION_STATUS'; payload: { stationId: string; status: StationStatus } }
  | { type: 'UPDATE_STATION_MODE'; payload: { stationId: string; mode: StationMode } }
  | { type: 'CALL_NEXT_TICKET'; payload: { stationId: string; ticketType: TicketType } }
  | { type: 'COMPLETE_TICKET'; payload: { stationId: string } }
  | { type: 'SKIP_TICKET'; payload: { stationId: string } }
  | { type: 'ADD_STATION'; payload: { name: string; type: IStationType } }
  | { type: 'REMOVE_STATION'; payload: { stationId: string } }
  | { type: 'HYDRATE_STATE', payload: Partial<State> }
  | { type: 'RESET_STATE' };


type QueueContextType = {
  state: State;
  dispatch: React.Dispatch<Action>;
  getWaitingTickets: (type: TicketType) => Ticket[];
  getServedTickets: (type: TicketType) => Ticket[];
  getTicketByStation: (stationId: string) => Ticket | undefined;
};

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const initialState: State = {
  tickets: [],
  stations: initialStations,
  lastTicketTimestamp: null,
};

const queueReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TICKET': {
      const { ticket } = action.payload;
      const now = ticket.createdAt;
      const isNewDay = state.lastTicketTimestamp
        ? new Date(state.lastTicketTimestamp).toDateString() !== new Date(now).toDateString()
        : true;
      
      const newTickets = isNewDay ? [ticket] : [...state.tickets, ticket];

      return { 
          ...state, 
          tickets: newTickets,
          lastTicketTimestamp: now,
      };
    }
    case 'UPDATE_STATION_STATUS': {
      return {
        ...state,
        stations: state.stations.map((s) =>
          s.id === action.payload.stationId ? { ...s, status: action.payload.status } : s
        ),
      };
    }
    case 'UPDATE_STATION_MODE': {
      return {
        ...state,
        stations: state.stations.map((s) =>
          s.id === action.payload.stationId ? { ...s, mode: action.payload.mode } : s
        ),
      };
    }
    case 'CALL_NEXT_TICKET': {
      const { stationId, ticketType } = action.payload;
      const station = state.stations.find((s) => s.id === stationId);
      if (!station || station.status === 'closed' || station.currentTicketId) {
        return state;
      }

      const nextTicket = state.tickets
        .filter((t) => t.type === ticketType && t.status === 'waiting')
        .sort((a, b) => a.createdAt - b.createdAt)[0];

      if (!nextTicket) {
        return state;
      }
      
      const updatedTickets = state.tickets.map((t) =>
        t.id === nextTicket.id
          ? { ...t, status: 'serving', servedBy: stationId, calledAt: Date.now() }
          : t
      );

      const updatedStations = state.stations.map((s) =>
        s.id === stationId ? { ...s, currentTicketId: nextTicket.id } : s
      );

      return { ...state, tickets: updatedTickets, stations: updatedStations };
    }
    case 'COMPLETE_TICKET':
    case 'SKIP_TICKET': {
      const { stationId } = action.payload;
      const station = state.stations.find((s) => s.id === stationId);
      if (!station || !station.currentTicketId) {
        return state;
      }

      const newStatus = action.type === 'COMPLETE_TICKET' ? 'served' : 'skipped';
      
      const updatedTickets = state.tickets.map((t) =>
        t.id === station.currentTicketId
          ? { ...t, status: newStatus, servedAt: Date.now() }
          : t
      );

      const updatedStations = state.stations.map((s) =>
        s.id === stationId ? { ...s, currentTicketId: null } : s
      );

      return { ...state, tickets: updatedTickets, stations: updatedStations };
    }
    case 'ADD_STATION': {
      const { name, type } = action.payload;
      const newStation: Station = {
        id: `station-${Date.now()}`,
        name,
        type,
        status: 'closed',
        mode: 'regular',
        currentTicketId: null,
      };
      return { ...state, stations: [...state.stations, newStation] };
    }
    case 'REMOVE_STATION': {
        return {
            ...state,
            stations: state.stations.filter(s => s.id !== action.payload.stationId),
        };
    }
    case 'HYDRATE_STATE':
        return {
            ...initialState,
            ...action.payload,
        };

    case 'RESET_STATE': {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('queueState');
      }
      return initialState;
    }
    default:
      return state;
  }
};

export const QueueProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(queueReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on initial client-side render
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('queueState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState.tickets && parsedState.stations) {
          dispatch({ type: 'HYDRATE_STATE', payload: parsedState });
        }
      }
    } catch (error) {
      console.error("Could not load state from localStorage", error);
    } finally {
        setIsHydrated(true);
    }
  }, []);

  // Save state to localStorage on every change, but only after hydration
  useEffect(() => {
    if (!isHydrated) {
        return;
    }
    try {
      localStorage.setItem('queueState', JSON.stringify(state));
    } catch (error) {
      console.error("Could not save state to localStorage", error);
    }
  }, [state, isHydrated]);


  const getWaitingTickets = (type: TicketType) => {
    return state.tickets
      .filter((t) => t.type === type && t.status === 'waiting')
      .sort((a, b) => a.createdAt - b.createdAt);
  };
  
  const getServedTickets = (type: TicketType) => {
    return state.tickets
      .filter((t) => t.type === type && (t.status === 'serving' || t.status === 'served' || t.status === 'skipped'))
      .sort((a, b) => (b.calledAt ?? 0) - (a.calledAt ?? 0));
  }

  const getTicketByStation = (stationId: string) => {
      const station = state.stations.find(s => s.id === stationId);
      if (!station || !station.currentTicketId) return undefined;
      return state.tickets.find(t => t.id === station.currentTicketId);
  }

  const value = useMemo(() => ({ state, dispatch, getWaitingTickets, getServedTickets, getTicketByStation }), [state]);

  return (
    <QueueContext.Provider value={value}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
