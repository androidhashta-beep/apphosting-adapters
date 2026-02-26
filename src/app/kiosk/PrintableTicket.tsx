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
        {companyLogoUrl && (
            <img src={companyLogoUrl} alt="Company Logo" style={{maxWidth: '150px', maxHeight: '50px', margin: '0 auto 1rem auto', display: 'block', objectFit: 'contain'}} />
        )}
        <h3 className="company-name">{companyName}</h3>
        
        <div className="ticket-item">
          <p className="ticket-item-label">Ticket Number</p>
          <p className="ticket-number">{ticket.ticketNumber}</p>
        </div>

        <div className="ticket-item">
          <p className="ticket-item-label">Service</p>
          <p className="service-type">{service?.label || ticket.type}</p>
        </div>

        <hr className="separator" />

        <div className="ticket-item">
            <p className="ticket-item-label">Date & Time</p>
            <p className="timestamp">
            {createdAtDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            })} - {createdAtDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })}
            </p>
        </div>

        <p className="footer-message">Please wait for your number to be called.</p>
      </div>
    );
  }
);

PrintableTicket.displayName = 'PrintableTicket';
