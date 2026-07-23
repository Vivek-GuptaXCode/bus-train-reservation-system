
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
