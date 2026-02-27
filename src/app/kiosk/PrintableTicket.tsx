"use client";
import type { Ticket, Service } from '@/lib/types';
import React from 'react';
import { Timestamp } from 'firebase/firestore';

type PrintableTicketProps = {
  ticket: Ticket | null;
  companyName: string;
  companyLogoUrl?: string | null;
  service?: Service | null;
};

export const PrintableTicket = React.forwardRef<HTMLDivElement, PrintableTicketProps>(
  ({ ticket, companyName, companyLogoUrl, service }, ref) => {
    if (!ticket) return null;
    const createdAtDate = ticket.createdAt instanceof Timestamp ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
    return (
      <div ref={ref} className="ticket-content">
        <p className="company-name">{companyName}</p>
        <p className="ticket-number">{ticket.ticketNumber}</p>
        <p className="service-type">{service?.label || ticket.type}</p>
        <p className="timestamp">
          {createdAtDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} {createdAtDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </p>
      </div>
    );
  }
);
PrintableTicket.displayName = 'PrintableTicket';
