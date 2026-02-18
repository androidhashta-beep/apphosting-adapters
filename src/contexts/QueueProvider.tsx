
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
  | { type: 'ADD_TICKET'; payload: { type: TicketType } }
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
  isHydrated: boolean;
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
      const { type } = action.payload;
      const now = Date.now();
      
      const isNewDay = state.lastTicketTimestamp
        ? new Date(state.lastTicketTimestamp).toDateString() !== new Date(now).toDateString()
        : true;
      
      const ticketsToCount = isNewDay ? [] : state.tickets;
      const newNumber = ticketsToCount.length + 1;
      
      const ticketNumber = `${newNumber}`;
      
      const newTicket: Ticket = {
        id: `${type}-${newNumber}-${now}`,
        ticketNumber: ticketNumber,
        type,
        status: 'waiting',
        createdAt: now,
      };
      
      const newTickets = isNewDay ? [newTicket] : [...state.tickets, newTicket];

      return { 
          ...state, 
          tickets: newTickets,
          lastTicketTimestamp: now,
      };
    }
    case 'UPDATE_STATION_STATUS': {
      const { stationId, status } = action.payload;
      const stationToUpdate = state.stations.find(s => s.id === stationId);
      let updatedTickets = state.tickets;
      let updatedStations = state.stations;

      // If closing a station that is serving a ticket, return ticket to queue
      if (status === 'closed' && stationToUpdate && stationToUpdate.currentTicketId) {
        updatedTickets = state.tickets.map(ticket => {
          if (ticket.id === stationToUpdate.currentTicketId) {
            return {
              ...ticket,
              status: 'waiting',
              servedBy: undefined,
              calledAt: undefined,
            };
          }
          return ticket;
        });

        updatedStations = state.stations.map((s) =>
          s.id === stationId ? { ...s, status: status, currentTicketId: null } : s
        );
      } else {
        updatedStations = state.stations.map((s) =>
          s.id === stationId ? { ...s, status: status } : s
        );
      }
      
      return {
        ...state,
        stations: updatedStations,
        tickets: updatedTickets,
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
        const { stationId } = action.payload;
        const stationToRemove = state.stations.find(s => s.id === stationId);
        let updatedTickets = state.tickets;

        if (stationToRemove && stationToRemove.currentTicketId) {
            updatedTickets = state.tickets.map(ticket => {
                if (ticket.id === stationToRemove.currentTicketId) {
                    return { 
                        ...ticket, 
                        status: 'waiting', 
                        servedBy: undefined, 
                        calledAt: undefined 
                    };
                }
                return ticket;
            });
        }

        return {
            ...state,
            stations: state.stations.filter(s => s.id !== stationId),
            tickets: updatedTickets,
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
      const savedStateJSON = localStorage.getItem('queueState');
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        
        // Check if the loaded tickets have the old, prefixed format (e.g., "E-1").
        const needsMigration = savedState.tickets && savedState.tickets.some((t: Ticket) => isNaN(parseInt(t.ticketNumber, 10)));

        if (needsMigration) {
          // If the format is old, clear the tickets and timestamp to start fresh,
          // but preserve the user's station configuration.
          const migratedState = {
            ...savedState,
            tickets: [],
            lastTicketTimestamp: null,
          };
          dispatch({ type: 'HYDRATE_STATE', payload: migratedState });
        } else if (savedState.tickets && savedState.stations) {
          // If state is in the correct format, hydrate normally.
          dispatch({ type: 'HYDRATE_STATE', payload: savedState });
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

  const value = useMemo(() => ({ state, dispatch, getWaitingTickets, getServedTickets, getTicketByStation, isHydrated }), [state, isHydrated]);

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
