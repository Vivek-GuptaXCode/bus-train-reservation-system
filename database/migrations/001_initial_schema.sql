-- ============================================================================
-- Migration: 001_initial_schema
-- Description: Creates all tables for the Bus & Train Reservation System
-- Author: Student Project
-- Date: July 2026
-- ============================================================================

-- TODO: Add proper error handling for failed migrations in production
-- FIXME: Some CHECK constraints could be moved to domain types later

BEGIN;

-- ============================================================================
-- TABLE 1: role
-- Stores the different user roles in the system (RBAC)
-- ============================================================================
CREATE TABLE role (
    role_id     bigint GENERATED ALWAYS AS IDENTITY,
    role_name   varchar(40) NOT NULL UNIQUE,

    CONSTRAINT pk_role PRIMARY KEY (role_id),
    CONSTRAINT chk_role_name CHECK (
        role_name IN ('Passenger', 'Booking Clerk', 'Operations Staff', 'Administrator')
    )
);

-- ============================================================================
-- TABLE 2: user_account
-- Core user account info. Every person with system access has one record here.
-- ============================================================================
CREATE TABLE user_account (
    user_id         bigint GENERATED ALWAYS AS IDENTITY,
    name            varchar(80) NOT NULL UNIQUE,
    password_hash   text NOT NULL,
    full_name       varchar(120) NOT NULL,
    phone           varchar(25) NOT NULL,
    role_id         bigint NOT NULL,

    CONSTRAINT pk_user_account PRIMARY KEY (user_id),
    CONSTRAINT fk_user_account_role FOREIGN KEY (role_id) REFERENCES role(role_id)
);

-- ============================================================================
-- TABLE 3: passenger
-- Passengers are users who actually book and travel.
-- One user can be linked to at most one passenger record (UNIQUE user_id).
-- ============================================================================
CREATE TABLE passenger (
    p_id    bigint GENERATED ALWAYS AS IDENTITY,
    name    varchar(120) NOT NULL,
    phone   varchar(25) NOT NULL,
    email   varchar(254) NOT NULL UNIQUE,
    gender  varchar(30),
    age     smallint,
    user_id bigint NOT NULL,

    CONSTRAINT pk_passenger PRIMARY KEY (p_id),
    CONSTRAINT fk_passenger_user FOREIGN KEY (user_id) REFERENCES user_account(user_id),
    CONSTRAINT uq_passenger_user UNIQUE (user_id),
    CONSTRAINT chk_passenger_age CHECK (age >= 0 AND age <= 130)
);

-- ============================================================================
-- TABLE 4: identification_document
-- Stores ID proof documents that passengers can upload.
-- ============================================================================
CREATE TABLE identification_document (
    document_id bigint GENERATED ALWAYS AS IDENTITY,
    doc_type    varchar(80) NOT NULL,
    doc_url     text NOT NULL,

    CONSTRAINT pk_identification_document PRIMARY KEY (document_id)
);

-- ============================================================================
-- TABLE 5: route
-- Defines the travel routes between cities/stations.
-- total_distance is in kilometres.
-- ============================================================================
CREATE TABLE route (
    route_id        bigint GENERATED ALWAYS AS IDENTITY,
    route_name      varchar(150) NOT NULL UNIQUE,
    total_distance  numeric(10,2) NOT NULL,

    CONSTRAINT pk_route PRIMARY KEY (route_id),
    CONSTRAINT chk_route_distance CHECK (total_distance >= 0)
);

-- ============================================================================
-- TABLE 6: route_stop
-- Intermediate stops along a route.
-- stop_sequence tells you the order (1 = first, 2 = second, etc.)
-- distance_from_origin is how far from the start this stop is (in km).
-- ============================================================================
CREATE TABLE route_stop (
    route_stop_id           bigint GENERATED ALWAYS AS IDENTITY,
    stop_name               varchar(150) NOT NULL,
    stop_sequence           integer NOT NULL,
    distance_from_origin    numeric(10,2) NOT NULL,
    arrival_time            time,
    departure_time          time,
    route_id                bigint NOT NULL,

    CONSTRAINT pk_route_stop PRIMARY KEY (route_stop_id),
    CONSTRAINT fk_route_stop_route FOREIGN KEY (route_id) REFERENCES route(route_id),
    CONSTRAINT uq_route_stop_sequence UNIQUE (route_id, stop_sequence),
    CONSTRAINT uq_route_stop_name UNIQUE (route_id, stop_name),
    CONSTRAINT chk_stop_sequence CHECK (stop_sequence > 0),
    CONSTRAINT chk_stop_distance CHECK (distance_from_origin >= 0)
);

-- ============================================================================
-- TABLE 7: service
-- A service is a scheduled offering on a route (like "City Bus Service").
-- It tells WHAT is being offered, not WHEN (that's service_run).
-- ============================================================================
CREATE TABLE service (
    service_id      bigint GENERATED ALWAYS AS IDENTITY,
    service_name    varchar(150) NOT NULL UNIQUE,
    service_type    varchar(10) NOT NULL,
    status          varchar(30) NOT NULL,
    route_id        bigint NOT NULL,

    CONSTRAINT pk_service PRIMARY KEY (service_id),
    CONSTRAINT fk_service_route FOREIGN KEY (route_id) REFERENCES route(route_id),
    CONSTRAINT chk_service_type CHECK (service_type IN ('Bus', 'Train'))
);

-- ============================================================================
-- TABLE 8: transport
-- Represents actual physical vehicles (buses and trains).
-- Each has a unique transport number and a fixed passenger capacity.
-- ============================================================================
CREATE TABLE transport (
    transport_id        bigint GENERATED ALWAYS AS IDENTITY,
    transport_type      varchar(10) NOT NULL,
    transport_number    varchar(80) NOT NULL UNIQUE,
    capacity            integer NOT NULL,

    CONSTRAINT pk_transport PRIMARY KEY (transport_id),
    CONSTRAINT chk_transport_type CHECK (transport_type IN ('Bus', 'Train')),
    CONSTRAINT chk_transport_capacity CHECK (capacity > 0)
);

-- ============================================================================
-- TABLE 9: seat
-- Individual seats inside a transport vehicle.
-- seat_no is like "1A", "B2", etc. Unique per transport.
-- ============================================================================
CREATE TABLE seat (
    seat_id         bigint GENERATED ALWAYS AS IDENTITY,
    seat_no         varchar(20) NOT NULL,
    transport_id    bigint NOT NULL,

    CONSTRAINT pk_seat PRIMARY KEY (seat_id),
    CONSTRAINT fk_seat_transport FOREIGN KEY (transport_id) REFERENCES transport(transport_id),
    CONSTRAINT uq_seat_transport_no UNIQUE (transport_id, seat_no)
);

-- ============================================================================
-- TABLE 10: service_run
-- An actual trip/run of a service. Links a service to a specific transport vehicle
-- on a specific date and time. departure_time must be before arrival_time.
-- ============================================================================
CREATE TABLE service_run (
    service_run_id  bigint GENERATED ALWAYS AS IDENTITY,
    run_id          varchar(80) NOT NULL UNIQUE,
    departure_time  timestamptz NOT NULL,
    arrival_time    timestamptz NOT NULL,
    status          varchar(20) NOT NULL,
    transport_id    bigint NOT NULL,
    service_id      bigint NOT NULL,

    CONSTRAINT pk_service_run PRIMARY KEY (service_run_id),
    CONSTRAINT fk_service_run_transport FOREIGN KEY (transport_id) REFERENCES transport(transport_id),
    CONSTRAINT fk_service_run_service FOREIGN KEY (service_id) REFERENCES service(service_id),
    CONSTRAINT chk_service_run_status CHECK (status IN ('Open', 'Closed', 'Cancelled')),
    CONSTRAINT chk_service_run_times CHECK (arrival_time > departure_time)
);

-- ============================================================================
-- TABLE 11: payment
-- Records all financial transactions. Links to bookings via UNIQUE FK.
-- date_time defaults to the current timestamp when row is inserted.
-- ============================================================================
CREATE TABLE payment (
    payment_id      bigint GENERATED ALWAYS AS IDENTITY,
    date_time       timestamptz NOT NULL DEFAULT now(),
    amount          numeric(12,2) NOT NULL,
    mode            varchar(40) NOT NULL,
    status          varchar(20) NOT NULL,
    transaction_id  varchar(120) NOT NULL UNIQUE,

    CONSTRAINT pk_payment PRIMARY KEY (payment_id),
    CONSTRAINT chk_payment_amount CHECK (amount >= 0),
    CONSTRAINT chk_payment_status CHECK (status IN ('Pending', 'Successful', 'Failed', 'Refunded'))
);

-- ============================================================================
-- TABLE 12: booking
-- Central booking table. One booking = one passenger on one trip.
-- boarding_stop_id must be different from disembarking_stop_id (can't get on
-- and off at the same stop).
-- ============================================================================
CREATE TABLE booking (
    booking_id              bigint GENERATED ALWAYS AS IDENTITY,
    date_time               timestamptz NOT NULL DEFAULT now(),
    total_amount            numeric(12,2) NOT NULL,
    status                  varchar(20) NOT NULL,
    p_id                    bigint NOT NULL,
    payment_id              bigint,
    document_id             bigint,
    boarding_stop_id        bigint NOT NULL,
    disembarking_stop_id    bigint NOT NULL,

    CONSTRAINT pk_booking PRIMARY KEY (booking_id),
    CONSTRAINT fk_booking_passenger FOREIGN KEY (p_id) REFERENCES passenger(p_id),
    CONSTRAINT fk_booking_payment FOREIGN KEY (payment_id) REFERENCES payment(payment_id),
    CONSTRAINT fk_booking_document FOREIGN KEY (document_id) REFERENCES identification_document(document_id),
    CONSTRAINT fk_booking_boarding FOREIGN KEY (boarding_stop_id) REFERENCES route_stop(route_stop_id),
    CONSTRAINT fk_booking_disembarking FOREIGN KEY (disembarking_stop_id) REFERENCES route_stop(route_stop_id),
    CONSTRAINT uq_booking_payment UNIQUE (payment_id),
    CONSTRAINT chk_booking_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_booking_status CHECK (status IN ('Pending', 'Confirmed', 'Cancelled')),
    CONSTRAINT chk_booking_stops CHECK (boarding_stop_id <> disembarking_stop_id)
);

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


-- ============================================================================
-- TRIGGER FUNCTIONS
-- Business logic enforced at the database level.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Trigger 1: validate_service_run_transport_type
-- Makes sure the transport vehicle type (Bus/Train) matches the service type.
-- e.g., you can't assign a Bus transport to a Train service and vice versa.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_service_run_transport_type()
RETURNS TRIGGER AS $$
DECLARE
    v_service_type      varchar(10);
    v_transport_type    varchar(10);
BEGIN
    -- Fetch the service_type from the service table
    SELECT service_type INTO v_service_type
    FROM service
    WHERE service_id = NEW.service_id;

    -- Fetch the transport_type from the transport table
    SELECT transport_type INTO v_transport_type
    FROM transport
    WHERE transport_id = NEW.transport_id;

    -- Check if they match; raise an error if they don't
    IF v_service_type <> v_transport_type THEN
        RAISE EXCEPTION 'Service type (%) does not match transport type (%) for this run.',
            v_service_type, v_transport_type;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to service_run table
-- It fires BEFORE INSERT or UPDATE so we can validate before writing
CREATE TRIGGER trg_validate_sr_transport_type
    BEFORE INSERT OR UPDATE ON service_run
    FOR EACH ROW
    EXECUTE FUNCTION validate_service_run_transport_type();

-- ---------------------------------------------------------------------------
-- Trigger 2: validate_ticket_seat_transport
-- Ensures the seat being booked actually belongs to the transport used by
-- the service run. Prevents booking a bus seat on a train trip!
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_ticket_seat_transport()
RETURNS TRIGGER AS $$
DECLARE
    v_transport_of_run      bigint;
    v_transport_of_seat     bigint;
BEGIN
    -- Get the transport_id of the service run this ticket is for
    SELECT transport_id INTO v_transport_of_run
    FROM service_run
    WHERE service_run_id = NEW.service_run_id;

    -- Get the transport_id that this seat belongs to
    SELECT transport_id INTO v_transport_of_seat
    FROM seat
    WHERE seat_id = NEW.seat_id;

    -- If they don't match, it's an invalid assignment
    IF v_transport_of_run <> v_transport_of_seat THEN
        RAISE EXCEPTION 'Seat (ID: %) does not belong to the transport (ID: %) used by this service run.',
            NEW.seat_id, v_transport_of_run;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to ticket table
CREATE TRIGGER trg_validate_ticket_seat_transport
    BEFORE INSERT OR UPDATE ON ticket
    FOR EACH ROW
    EXECUTE FUNCTION validate_ticket_seat_transport();

COMMIT;

-- All done! The schema is ready for the seed data migration.
