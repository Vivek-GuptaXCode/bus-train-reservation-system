
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
