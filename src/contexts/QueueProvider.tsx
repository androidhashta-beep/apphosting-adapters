"use client";

import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import type { Station, Ticket, TicketType, StationStatus, StationMode } from '@/lib/types';
import { initialStations } from '@/lib/data';

type State = {
  tickets: Ticket[];
  stations: Station[];
};

type Action =
  | { type: 'ADD_TICKET'; payload: { type: TicketType } }
  | { type: 'UPDATE_STATION_STATUS'; payload: { stationId: string; status: StationStatus } }
  | { type: 'UPDATE_STATION_MODE'; payload: { stationId: string; mode: StationMode } }
  | { type: 'CALL_NEXT_TICKET'; payload: { stationId: string; ticketType: TicketType } }
  | { type: 'COMPLETE_TICKET'; payload: { stationId: string } }
  | { type: 'SKIP_TICKET'; payload: { stationId: string } };

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
};

const queueReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TICKET': {
      const { type } = action.payload;
      const prefix = type === 'counter' ? 'C' : type === 'cashier' ? 'S' : 'R';
      const lastTicketOfType = state.tickets
        .filter((t) => t.type === type)
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      const newNumber = lastTicketOfType
        ? parseInt(lastTicketOfType.ticketNumber.split('-')[1]) + 1
        : 101;

      const newTicket: Ticket = {
        id: `${type}-${newNumber}-${Date.now()}`,
        ticketNumber: `${prefix}-${newNumber}`,
        type,
        status: 'waiting',
        createdAt: Date.now(),
      };
      return { ...state, tickets: [...state.tickets, newTicket] };
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
    default:
      return state;
  }
};

export const QueueProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(queueReducer, initialState);

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
