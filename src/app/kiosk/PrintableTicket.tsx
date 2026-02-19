"use client";

import type { Ticket, Service } from '@/lib/types';
import React from 'react';

type PrintableTicketProps = {
  ticket: Ticket | null;
  companyName: string;
  service?: Service | null;
};

export const PrintableTicket = React.forwardRef<HTMLDivElement, PrintableTicketProps>(
  ({ ticket, companyName, service }, ref) => {
    if (!ticket) return null;

    return (
      <div ref={ref} className="ticket-content">
        <h3 className="company-name">{companyName}</h3>
        <p className="ticket-label">Your Queue Number is:</p>
        <p className="ticket-number">{ticket.ticketNumber}</p>
        <p className="service-type">Service: {service?.label || ticket.type}</p>
        <hr className="separator" />
        <p className="timestamp">
          {new Date(ticket.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })} - {new Date(ticket.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </p>
        <p className="footer-message">Please wait for your number to be called.</p>
      </div>
    );
  }
);

PrintableTicket.displayName = 'PrintableTicket';
