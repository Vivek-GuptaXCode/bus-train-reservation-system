
-- ============================================================================
-- TABLE 16: refund
-- Refunds are linked to cancellations. Each cancellation gets at most one refund.
-- ============================================================================
CREATE TABLE refund (
    refund_id       bigint GENERATED ALWAYS AS IDENTITY,
    amount          numeric(12,2) NOT NULL,
    date_time       timestamptz NOT NULL DEFAULT now(),
    status          varchar(30) NOT NULL,
    cancellation_id bigint NOT NULL,

    CONSTRAINT pk_refund PRIMARY KEY (refund_id),
    CONSTRAINT fk_refund_cancellation FOREIGN KEY (cancellation_id) REFERENCES cancellation(cancellation_id),
    CONSTRAINT uq_refund_cancellation UNIQUE (cancellation_id),
    CONSTRAINT chk_refund_amount CHECK (amount >= 0)
);


-- ============================================================================
-- INDEXES
-- Creating indexes on commonly queried columns for performance.
-- FIXME: Review index usage in production — some might be redundant with PK/FK indexes
-- ============================================================================

-- User and role lookups (for login and authorization)
CREATE INDEX idx_user_account_role ON user_account(role_id);

-- Fast lookup of passenger by their linked user account
CREATE INDEX idx_passenger_user ON passenger(user_id);

-- Speeds up queries that fetch stops in order for a given route
CREATE INDEX idx_route_stop_route_sequence ON route_stop(route_id, stop_sequence);

-- Helps filter services by route and type (e.g., "show all Bus services on route 5")
CREATE INDEX idx_service_route_type ON service(route_id, service_type);

-- Main search index: find service runs by service, departure time, and status
CREATE INDEX idx_service_run_search ON service_run(service_id, departure_time, status);

-- Look up which service runs use a particular transport vehicle
CREATE INDEX idx_service_run_transport ON service_run(transport_id);

-- Seat lookup within a transport (e.g., "is seat 3A available on BUS-001?")
CREATE INDEX idx_seat_transport ON seat(transport_id, seat_no);

-- Passenger booking history, sorted by most recent first
CREATE INDEX idx_booking_passenger_time ON booking(p_id, date_time DESC);

-- Join bookings to payments quickly
CREATE INDEX idx_booking_payment ON booking(payment_id);

-- Search bookings by boarding/disembarking stops
CREATE INDEX idx_booking_stops ON booking(boarding_stop_id, disembarking_stop_id);

-- Look up tickets by service run and seat (seat availability checks)
CREATE INDEX idx_ticket_run_seat ON ticket(service_run_id, seat_id);

-- Fetch all tickets belonging to a booking
CREATE INDEX idx_ticket_booking ON ticket(booking_id);

-- Quick lookup of cancellation by ticket
CREATE INDEX idx_cancellation_ticket ON cancellation(ticket_id);

-- Quick lookup of refund by cancellation
CREATE INDEX idx_refund_cancellation ON refund(cancellation_id);

-- Filter/sort payments by status and most recent first
CREATE INDEX idx_payment_status_time ON payment(status, date_time DESC);
