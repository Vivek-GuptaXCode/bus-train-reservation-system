
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
