
-- ============================================================================
-- TABLE 13: ticket
-- Each ticket is for a specific seat on a specific service run, within a booking.
-- A booking can have multiple tickets (one per seat), but a seat can only be
-- booked once per booking (UNIQUE constraint on booking_id + seat_id).
-- ============================================================================
CREATE TABLE ticket (
    ticket_id           bigint GENERATED ALWAYS AS IDENTITY,
    fare_amount         numeric(12,2) NOT NULL,
    boarding_info       text NOT NULL,
    disembarking_info   text NOT NULL,
    booking_id          bigint NOT NULL,
    service_run_id      bigint NOT NULL,
    seat_id             bigint NOT NULL,

    CONSTRAINT pk_ticket PRIMARY KEY (ticket_id),
    CONSTRAINT fk_ticket_booking FOREIGN KEY (booking_id) REFERENCES booking(booking_id),
    CONSTRAINT fk_ticket_service_run FOREIGN KEY (service_run_id) REFERENCES service_run(service_run_id),
    CONSTRAINT fk_ticket_seat FOREIGN KEY (seat_id) REFERENCES seat(seat_id),
    CONSTRAINT uq_ticket_booking_seat UNIQUE (booking_id, seat_id),
    CONSTRAINT chk_ticket_fare CHECK (fare_amount >= 0)
);

-- ============================================================================
-- TABLE 14: e_ticket
-- Digital ticket with QR code and PDF. One e-ticket per physical ticket.
-- ============================================================================
CREATE TABLE e_ticket (
    e_ticket_id     bigint GENERATED ALWAYS AS IDENTITY,
    issue_datetime  timestamptz NOT NULL DEFAULT now(),
    qr_code         text NOT NULL,
    pdf_url         text NOT NULL,
    ticket_id       bigint NOT NULL,

    CONSTRAINT pk_e_ticket PRIMARY KEY (e_ticket_id),
    CONSTRAINT fk_e_ticket_ticket FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id),
    CONSTRAINT uq_e_ticket_ticket UNIQUE (ticket_id)
);

-- ============================================================================
-- TABLE 15: cancellation
-- When a ticket is cancelled, a record is created here with the reason.
-- Each ticket can be cancelled at most once (UNIQUE ticket_id).
-- ============================================================================
CREATE TABLE cancellation (
    cancellation_id bigint GENERATED ALWAYS AS IDENTITY,
    reason          text NOT NULL,
    date_time       timestamptz NOT NULL DEFAULT now(),
    ticket_id       bigint NOT NULL,

    CONSTRAINT pk_cancellation PRIMARY KEY (cancellation_id),
    CONSTRAINT fk_cancellation_ticket FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id),
    CONSTRAINT uq_cancellation_ticket UNIQUE (ticket_id)
);
