# Bus and Train Reservation System
## Highly Detailed PERN Stack Implementation Specification

**Stack:** PostgreSQL, Express.js, React, Node.js  
**Project type:** DBMS-focused academic implementation  
**Source documents:**

1. `Bus_Train_Reservation_System_SRS.pdf`
2. `ER diagram.pdf`
3. `Relational_Schema.pdf`

---

## 1. Purpose of This Implementation Document

This document converts the supplied Software Requirements Specification, ER diagram, and relational schema into a detailed implementation plan for a PERN-stack application.

The implementation keeps the focus on:

- relational data design;
- primary-key and foreign-key integrity;
- leg-wise seat availability;
- transactional booking and cancellation;
- role-based access control;
- route-wise occupancy and revenue reporting;
- clear traceability from requirements to database objects, API endpoints, backend services, React pages, and tests.

Detailed visual design is intentionally limited because the SRS states that screen design and user-interface layout are outside the project scope.

---

## 2. Source-of-Truth and Reconciliation Policy

The three supplied artifacts are mostly consistent, but the ER diagram contains several connector placements that conflict with the relational schema and the written SRS. The implementation therefore uses the following precedence:

1. Written functional requirements, business rules, constraints, use cases, and acceptance criteria in the SRS.
2. Relational schema and data dictionary in the SRS and the separate relational-schema document.
3. ER-diagram cardinalities where they do not conflict with items 1 and 2.

### 2.1 Reconciled relationship decisions

| Area | Source conflict | Implementation decision |
|---|---|---|
| Boarding and disembarking stops | The ER diagram visually connects Route Stop through Payment, while the relational model places `boarding_stop_id` and `disembarking_stop_id` in `BOOKING`. | Store both stop foreign keys in `booking`, exactly as defined by the relational schema. |
| Identification document | The ER diagram shows Payment holding an Identification Document, while the relational schema places `document_id` in `BOOKING`. | Store `document_id` in `booking`. |
| Route composition | The ER diagram visually places a `CONSISTS` relationship between Route and Transport, while the SRS states Route consists of ordered Route Stops and Service belongs to Route. | Use `route -> route_stop` and `route -> service`. Do not create a direct `route.transport_id`. |
| Service and transport | The relational schema places both `service_id` and `transport_id` in `SERVICE_RUN`. | Treat `service_run` as the date-wise link between a service and the assigned transport. |
| Ticket and cancellation | The ER diagram shows optional cancellation for a ticket. | Enforce zero-or-one cancellation per ticket with a unique foreign key. |
| Ticket and e-ticket | The ER diagram and SRS specify one e-ticket per issued ticket. | Enforce one-to-one with a unique foreign key. |

### 2.2 Two mandatory schema-completion fields

The supplied relational schema omits two fields required to implement the SRS acceptance criteria:

1. `TICKET` has no `seat_id`, although FR-05, BR-01, BR-02, and Acceptance Criterion 3 require the system to identify the same seat across overlapping route segments.
2. `ROUTE_STOP` has no human-readable stop name, although FR-01 and FR-04 require route-stop management and searching between source and destination stops.

Therefore, this implementation adds only the following minimal completion fields:

```text
TICKET.seat_id -> SEAT.seat_id
ROUTE_STOP.stop_name
```

These are not new business features. They complete relationships already required by the supplied SRS and existing `SEAT` and `ROUTE_STOP` entities. All other business tables remain limited to the supplied model.

### 2.3 Requirements that remain configurable because the SRS does not define numeric rules

The SRS requires fare calculation and time-dependent refunds but does not provide fare rates or cancellation percentages. The implementation must not invent academic-business rules and hard-code them as if they were part of the source documents.

The following values are therefore deployment configuration:

- bus fare rate per distance unit;
- train fare rate per distance unit;
- cancellation time bands;
- refund percentage for each time band;
- concession percentage and accepted document types.

The server must refuse to start the booking/refund modules when mandatory policy configuration is missing.

---

## 3. Scope

### 3.1 Included

- user accounts and four roles;
- passenger records;
- route and ordered route-stop management;
- service, transport, seat, and service-run management;
- service search by source, destination, and travel date;
- seat-map display and leg-wise availability checking;
- booking creation;
- payment recording;
- ticket and e-ticket generation;
- ticket cancellation and refund recording;
- occupancy, revenue, cancellation, and refund reports;
- database transactions, integrity checks, indexing, backup guidance, audit timestamps, and access control.

### 3.2 Excluded

- complex UI/UX design;
- live vehicle tracking;
- dynamic route optimization;
- loyalty programmes;
- waiting lists;
- multi-operator settlement;
- promotional coupons;
- unspecified payment-gateway details;
- features requiring entities not present in the supplied documents.

---

## 4. User Roles and Access Model

The exact roles are derived from the SRS.

| Role | Main permissions |
|---|---|
| Passenger | Register, sign in, maintain own passenger profile, search services, view seat availability, book up to the allowed limit, view own bookings and e-tickets, cancel own eligible tickets. |
| Booking Clerk | Search services, create bookings for passengers, inspect booking and cancellation details. |
| Operations Staff | Manage routes, route stops, transports, seats, services, and service runs. |
| Administrator | Manage user roles, inspect system data, and view reports. |

### 4.1 RBAC rule

Authorization must be enforced in the Express backend. React route guards improve navigation but are not security controls.

```text
Authentication -> identify user -> load role -> authorize endpoint -> execute service
```

The server must return:

- `401 Unauthorized` when a valid login is absent;
- `403 Forbidden` when the authenticated role lacks permission.

---

## 5. High-Level PERN Architecture

```mermaid
flowchart LR
    B[Browser]
    R[React Application]
    E[Express REST API]
    A[Authentication and RBAC]
    S[Domain Services]
    P[(PostgreSQL)]
    F[PDF and QR Generator]
    O[Document and E-ticket File Storage]

    B --> R
    R --> E
    E --> A
    A --> S
    S --> P
    S --> F
    F --> O
    S --> O
```

### 5.1 Frontend responsibilities

- collect and validate user input;
- show role-appropriate navigation;
- call REST endpoints;
- show service-search results and seat status;
- display booking, ticket, cancellation, refund, and report data;
- never determine final fare, availability, authorization, or refund amount.

### 5.2 Backend responsibilities

- authenticate users;
- enforce RBAC;
- validate payloads;
- calculate fare using server configuration;
- perform service and seat searches;
- enforce all business rules;
- execute booking and cancellation transactions;
- generate QR content and e-ticket PDF URLs;
- generate report queries;
- write safe audit logs.

### 5.3 PostgreSQL responsibilities

- persist all master and transaction data;
- enforce entity, referential, domain, uniqueness, and cardinality constraints;
- serialize competing bookings for the same service-run seat;
- rollback incomplete booking or cancellation operations;
- support reports through indexed joins and aggregate queries.

---

## 6. Suggested Repository Structure

```text
bus-train-reservation-system/
|
|-- client/
|   |-- src/
|   |   |-- api/
|   |   |   |-- httpClient.js
|   |   |   |-- authApi.js
|   |   |   |-- searchApi.js
|   |   |   |-- bookingApi.js
|   |   |   |-- operationsApi.js
|   |   |   `-- reportsApi.js
|   |   |-- app/
|   |   |   |-- App.jsx
|   |   |   `-- routes.jsx
|   |   |-- components/
|   |   |   |-- auth/
|   |   |   |-- common/
|   |   |   |-- search/
|   |   |   |-- booking/
|   |   |   |-- operations/
|   |   |   `-- reports/
|   |   |-- contexts/
|   |   |   `-- AuthContext.jsx
|   |   |-- hooks/
|   |   |-- pages/
|   |   |   |-- public/
|   |   |   |-- passenger/
|   |   |   |-- clerk/
|   |   |   |-- operations/
|   |   |   `-- admin/
|   |   |-- utils/
|   |   `-- main.jsx
|   `-- package.json
|
|-- server/
|   |-- src/
|   |   |-- app.js
|   |   |-- server.js
|   |   |-- config/
|   |   |   |-- env.js
|   |   |   `-- policy.js
|   |   |-- db/
|   |   |   |-- pool.js
|   |   |   |-- transaction.js
|   |   |   `-- migrations/
|   |   |-- middleware/
|   |   |   |-- authenticate.js
|   |   |   |-- authorize.js
|   |   |   |-- validate.js
|   |   |   |-- errorHandler.js
|   |   |   `-- requestId.js
|   |   |-- modules/
|   |   |   |-- auth/
|   |   |   |-- users/
|   |   |   |-- passengers/
|   |   |   |-- routes/
|   |   |   |-- transports/
|   |   |   |-- services/
|   |   |   |-- serviceRuns/
|   |   |   |-- search/
|   |   |   |-- bookings/
|   |   |   |-- tickets/
|   |   |   |-- cancellations/
|   |   |   `-- reports/
|   |   |-- shared/
|   |   |   |-- errors.js
|   |   |   |-- constants.js
|   |   |   |-- money.js
|   |   |   `-- time.js
|   |   `-- tests/
|   `-- package.json
|
|-- database/
|   |-- migrations/
|   |-- seeds/
|   |-- views/
|   `-- backup/
|
|-- storage/
|   |-- identification-documents/
|   `-- e-tickets/
|
|-- .env.example
|-- README.md
`-- package.json
```

---

## 7. Environment Configuration

```dotenv
# Runtime
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

# PostgreSQL
DATABASE_URL=postgresql://app_user:strong_password@localhost:5432/bus_train_reservation
DB_POOL_MIN=2
DB_POOL_MAX=20

# Authentication
JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=2h
BCRYPT_COST=12

# Storage
PUBLIC_BASE_URL=http://localhost:5000
DOCUMENT_STORAGE_DIR=./storage/identification-documents
ETICKET_STORAGE_DIR=./storage/e-tickets

# Fare policy - values must be supplied by project owner
BUS_RATE_PER_DISTANCE_UNIT=
TRAIN_RATE_PER_DISTANCE_UNIT=
CONCESSION_PERCENT=
CONCESSION_DOCUMENT_TYPES=

# Refund policy - JSON array ordered from longest notice to shortest notice
# No percentages are supplied by the SRS, so this must be configured.
REFUND_POLICY_JSON=
```

### 7.1 Configuration validation

At startup, the server must validate:

- database URL is present;
- JWT secret is sufficiently long;
- fare rates are non-negative decimal values;
- refund policy parses as valid JSON;
- refund bands do not overlap;
- refund percentages are from 0 to 100;
- storage directories are writable.

---

## 8. PostgreSQL Logical Design

### 8.1 Canonical tables

The implementation uses the supplied tables:

- `role`
- `user_account`
- `passenger`
- `identification_document`
- `route`
- `route_stop`
- `service`
- `transport`
- `seat`
- `service_run`
- `payment`
- `booking`
- `ticket`
- `e_ticket`
- `cancellation`
- `refund`

### 8.2 Data-type conventions

| Data category | PostgreSQL type |
|---|---|
| Primary keys | `bigint GENERATED ALWAYS AS IDENTITY` |
| Money | `numeric(12,2)` |
| Auditable date-time | `timestamptz` |
| Route-stop scheduled clock time | `time` |
| Short controlled value | `varchar` with `CHECK` where the SRS defines the allowed set |
| URL/path | `text` |
| Phone | `varchar(25)` |
| Email | `varchar(254)` |
| Distance | `numeric(10,2)` |
| Age | `smallint` |

Use `numeric`, not floating-point types, for fare, payment, and refund values.

---

## 9. Database DDL

The following migration is the implementation baseline. It preserves the supplied entities and adds only `route_stop.stop_name` and `ticket.seat_id` for SRS completion.

```sql
BEGIN;

CREATE TABLE role (
    role_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name     varchar(40) NOT NULL UNIQUE,
    CONSTRAINT chk_role_name CHECK (
        role_name IN (
            'Passenger',
            'Booking Clerk',
            'Operations Staff',
            'Administrator'
        )
    )
);

CREATE TABLE user_account (
    user_id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name           varchar(80) NOT NULL UNIQUE,
    password_hash  text NOT NULL,
    full_name      varchar(120) NOT NULL,
    phone          varchar(25) NOT NULL,
    role_id        bigint NOT NULL REFERENCES role(role_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE passenger (
    p_id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name      varchar(120) NOT NULL,
    phone     varchar(25) NOT NULL,
    email     varchar(254) NOT NULL,
    gender    varchar(30),
    age       smallint,
    user_id   bigint NOT NULL UNIQUE REFERENCES user_account(user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_passenger_email UNIQUE (email),
    CONSTRAINT chk_passenger_age CHECK (age IS NULL OR age BETWEEN 0 AND 130)
);

CREATE TABLE identification_document (
    document_id  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    doc_type     varchar(80) NOT NULL,
    doc_url      text NOT NULL
);

CREATE TABLE route (
    route_id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    route_name      varchar(150) NOT NULL UNIQUE,
    total_distance  numeric(10,2) NOT NULL,
    CONSTRAINT chk_route_distance CHECK (total_distance >= 0)
);

CREATE TABLE route_stop (
    route_stop_id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stop_name            varchar(150) NOT NULL,
    stop_sequence        integer NOT NULL,
    distance_from_origin numeric(10,2) NOT NULL,
    arrival_time         time,
    departure_time       time,
    route_id             bigint NOT NULL REFERENCES route(route_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_route_stop_sequence UNIQUE (route_id, stop_sequence),
    CONSTRAINT uq_route_stop_name UNIQUE (route_id, stop_name),
    CONSTRAINT chk_stop_sequence CHECK (stop_sequence > 0),
    CONSTRAINT chk_stop_distance CHECK (distance_from_origin >= 0)
);

CREATE TABLE service (
    service_id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_name  varchar(150) NOT NULL,
    service_type  varchar(10) NOT NULL,
    status        varchar(30) NOT NULL,
    route_id      bigint NOT NULL REFERENCES route(route_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_service_name UNIQUE (service_name),
    CONSTRAINT chk_service_type CHECK (service_type IN ('Bus', 'Train'))
);

CREATE TABLE transport (
    transport_id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    transport_type    varchar(10) NOT NULL,
    transport_number  varchar(80) NOT NULL UNIQUE,
    capacity          integer NOT NULL,
    CONSTRAINT chk_transport_type CHECK (transport_type IN ('Bus', 'Train')),
    CONSTRAINT chk_transport_capacity CHECK (capacity > 0)
);

CREATE TABLE seat (
    seat_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seat_no       varchar(20) NOT NULL,
    transport_id  bigint NOT NULL REFERENCES transport(transport_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_transport_seat UNIQUE (transport_id, seat_no)
);

CREATE TABLE service_run (
    service_run_id  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    run_id          varchar(80) NOT NULL UNIQUE,
    departure_time  timestamptz NOT NULL,
    arrival_time    timestamptz NOT NULL,
    status          varchar(20) NOT NULL,
    transport_id    bigint NOT NULL REFERENCES transport(transport_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    service_id      bigint NOT NULL REFERENCES service(service_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_service_run_status CHECK (
        status IN ('Open', 'Closed', 'Cancelled')
    ),
    CONSTRAINT chk_service_run_time CHECK (arrival_time > departure_time)
);

CREATE TABLE payment (
    payment_id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    date_time      timestamptz NOT NULL DEFAULT now(),
    amount         numeric(12,2) NOT NULL,
    mode           varchar(40) NOT NULL,
    status         varchar(20) NOT NULL,
    transaction_id varchar(120) NOT NULL UNIQUE,
    CONSTRAINT chk_payment_amount CHECK (amount >= 0),
    CONSTRAINT chk_payment_status CHECK (
        status IN ('Pending', 'Successful', 'Failed', 'Refunded')
    )
);

CREATE TABLE booking (
    booking_id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    date_time           timestamptz NOT NULL DEFAULT now(),
    total_amount        numeric(12,2) NOT NULL,
    status              varchar(20) NOT NULL,
    p_id                bigint NOT NULL REFERENCES passenger(p_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    payment_id          bigint NOT NULL UNIQUE REFERENCES payment(payment_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    document_id         bigint REFERENCES identification_document(document_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    boarding_stop_id    bigint NOT NULL REFERENCES route_stop(route_stop_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    disembarking_stop_id bigint NOT NULL REFERENCES route_stop(route_stop_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_booking_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_booking_status CHECK (
        status IN ('Pending', 'Confirmed', 'Cancelled')
    ),
    CONSTRAINT chk_different_stops CHECK (
        boarding_stop_id <> disembarking_stop_id
    )
);

CREATE TABLE ticket (
    ticket_id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fare_amount         numeric(12,2) NOT NULL,
    boarding_info       text NOT NULL,
    disembarking_info   text NOT NULL,
    booking_id          bigint NOT NULL REFERENCES booking(booking_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    service_run_id      bigint NOT NULL REFERENCES service_run(service_run_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    seat_id             bigint NOT NULL REFERENCES seat(seat_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_ticket_fare CHECK (fare_amount >= 0),
    CONSTRAINT uq_booking_seat UNIQUE (booking_id, seat_id)
);

CREATE TABLE e_ticket (
    e_ticket_id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    issue_datetime timestamptz NOT NULL DEFAULT now(),
    qr_code        text NOT NULL,
    pdf_url        text NOT NULL,
    ticket_id      bigint NOT NULL UNIQUE REFERENCES ticket(ticket_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE cancellation (
    cancellation_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reason          text NOT NULL,
    date_time       timestamptz NOT NULL DEFAULT now(),
    ticket_id       bigint NOT NULL UNIQUE REFERENCES ticket(ticket_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE refund (
    refund_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    amount          numeric(12,2) NOT NULL,
    date_time       timestamptz NOT NULL DEFAULT now(),
    status          varchar(30) NOT NULL,
    cancellation_id bigint NOT NULL UNIQUE REFERENCES cancellation(cancellation_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_refund_amount CHECK (amount >= 0)
);

COMMIT;
```

### 9.1 Why selected deletes are restricted

Master records involved in historical bookings must not be physically deleted because this would break auditability and referential integrity. Operations staff should normally change status rather than delete:

- close or cancel a service run;
- deactivate a service through its status;
- stop using a transport without deleting historical references.

---

## 10. Database Indexes

```sql
CREATE INDEX idx_user_account_role
    ON user_account(role_id);

CREATE INDEX idx_passenger_user
    ON passenger(user_id);

CREATE INDEX idx_route_stop_route_sequence
    ON route_stop(route_id, stop_sequence);

CREATE INDEX idx_service_route_type
    ON service(route_id, service_type);

CREATE INDEX idx_service_run_search
    ON service_run(service_id, departure_time, status);

CREATE INDEX idx_service_run_transport
    ON service_run(transport_id);

CREATE INDEX idx_seat_transport
    ON seat(transport_id, seat_no);

CREATE INDEX idx_booking_passenger_time
    ON booking(p_id, date_time DESC);

CREATE INDEX idx_booking_payment
    ON booking(payment_id);

CREATE INDEX idx_booking_stops
    ON booking(boarding_stop_id, disembarking_stop_id);

CREATE INDEX idx_ticket_run_seat
    ON ticket(service_run_id, seat_id);

CREATE INDEX idx_ticket_booking
    ON ticket(booking_id);

CREATE INDEX idx_cancellation_ticket
    ON cancellation(ticket_id);

CREATE INDEX idx_refund_cancellation
    ON refund(cancellation_id);

CREATE INDEX idx_payment_status_time
    ON payment(status, date_time DESC);
```

The critical availability index is `(service_run_id, seat_id)` on `ticket`.

---

## 11. Database Integrity Functions and Triggers

### 11.1 Validate route-stop ordering and route membership

A booking is valid only when:

- both route-stop records belong to the service route;
- boarding sequence is lower than disembarking sequence;
- the service run is open;
- the service run has not departed.

This check requires joins and is therefore implemented in the booking service inside the same transaction. It may also be duplicated in a trigger for defence in depth.

### 11.2 Validate service and transport type compatibility

A Bus service must not use a Train transport and vice versa.

```sql
CREATE OR REPLACE FUNCTION validate_service_run_transport_type()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_service_type varchar(10);
    v_transport_type varchar(10);
BEGIN
    SELECT service_type
      INTO v_service_type
      FROM service
     WHERE service_id = NEW.service_id;

    SELECT transport_type
      INTO v_transport_type
      FROM transport
     WHERE transport_id = NEW.transport_id;

    IF v_service_type IS NULL OR v_transport_type IS NULL THEN
        RAISE EXCEPTION 'Invalid service or transport';
    END IF;

    IF v_service_type <> v_transport_type THEN
        RAISE EXCEPTION 'Service type and transport type must match';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_service_run_transport_type
BEFORE INSERT OR UPDATE OF service_id, transport_id
ON service_run
FOR EACH ROW
EXECUTE FUNCTION validate_service_run_transport_type();
```

### 11.3 Validate ticket seat belongs to the service-run transport

```sql
CREATE OR REPLACE FUNCTION validate_ticket_seat_transport()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_run_transport_id bigint;
    v_seat_transport_id bigint;
BEGIN
    SELECT transport_id
      INTO v_run_transport_id
      FROM service_run
     WHERE service_run_id = NEW.service_run_id;

    SELECT transport_id
      INTO v_seat_transport_id
      FROM seat
     WHERE seat_id = NEW.seat_id;

    IF v_run_transport_id IS NULL OR v_seat_transport_id IS NULL THEN
        RAISE EXCEPTION 'Invalid service run or seat';
    END IF;

    IF v_run_transport_id <> v_seat_transport_id THEN
        RAISE EXCEPTION 'Selected seat does not belong to the service-run transport';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_ticket_seat_transport
BEFORE INSERT OR UPDATE OF service_run_id, seat_id
ON ticket
FOR EACH ROW
EXECUTE FUNCTION validate_ticket_seat_transport();
```

### 11.4 Capacity and seat count

When seats are generated for a transport, the number of rows in `seat` must not exceed `transport.capacity`. The service should:

1. lock the transport row;
2. count existing seats;
3. reject insertion if `existing_count + requested_count > capacity`;
4. insert unique seat numbers.

---

## 12. Leg-Wise Seat Availability

### 12.1 Overlap definition

For half-open route segments:

```text
[new_boarding_sequence, new_destination_sequence)
[existing_boarding_sequence, existing_destination_sequence)
```

The segments overlap only when both conditions are true:

```text
new_boarding_sequence < existing_destination_sequence
AND
new_destination_sequence > existing_boarding_sequence
```

This correctly allows a seat booked from A to B to be booked again from B to C.

### 12.2 Availability query

```sql
WITH requested_segment AS (
    SELECT
        rb.route_id,
        rb.stop_sequence AS new_boarding_sequence,
        rd.stop_sequence AS new_destination_sequence
    FROM route_stop rb
    JOIN route_stop rd
      ON rd.route_id = rb.route_id
    WHERE rb.route_stop_id = $1
      AND rd.route_stop_id = $2
      AND rb.stop_sequence < rd.stop_sequence
),
run_context AS (
    SELECT
        sr.service_run_id,
        sr.transport_id,
        s.route_id
    FROM service_run sr
    JOIN service s ON s.service_id = sr.service_id
    WHERE sr.service_run_id = $3
      AND sr.status = 'Open'
),
occupied_seats AS (
    SELECT DISTINCT t.seat_id
    FROM ticket t
    JOIN booking b ON b.booking_id = t.booking_id
    JOIN payment p ON p.payment_id = b.payment_id
    JOIN route_stop eb ON eb.route_stop_id = b.boarding_stop_id
    JOIN route_stop ed ON ed.route_stop_id = b.disembarking_stop_id
    LEFT JOIN cancellation c ON c.ticket_id = t.ticket_id
    CROSS JOIN requested_segment rs
    WHERE t.service_run_id = $3
      AND b.status = 'Confirmed'
      AND p.status = 'Successful'
      AND c.ticket_id IS NULL
      AND rs.new_boarding_sequence < ed.stop_sequence
      AND rs.new_destination_sequence > eb.stop_sequence
)
SELECT
    s.seat_id,
    s.seat_no,
    CASE WHEN os.seat_id IS NULL THEN true ELSE false END AS is_available
FROM seat s
JOIN run_context rc ON rc.transport_id = s.transport_id
LEFT JOIN occupied_seats os ON os.seat_id = s.seat_id
CROSS JOIN requested_segment rs
WHERE rc.route_id = rs.route_id
ORDER BY s.seat_no;
```

### 12.3 Boundary examples

| Existing segment | New segment | Result |
|---|---|---|
| A-B | B-C | Available; segments touch but do not overlap. |
| A-C | B-D | Unavailable; overlap exists. |
| B-C | A-D | Unavailable; existing segment is inside new segment. |
| A-D | B-C | Unavailable; new segment is inside existing segment. |
| C-D | A-B | Available; separate segments. |

---

## 13. Concurrency-Safe Booking Transaction

A normal availability query is not sufficient because two users may select the same seat at the same time. The final booking operation must serialize competing requests.

### 13.1 Locking strategy

Inside a transaction:

1. lock the service-run row;
2. lock all selected seat rows in ascending `seat_id` order;
3. reload route-stop sequences;
4. check run status and departure time;
5. check seat ownership by transport;
6. re-run overlap detection;
7. enforce the six-ticket rule;
8. verify or update payment as successful;
9. insert booking;
10. insert tickets;
11. insert e-ticket records;
12. commit.

Locking seat rows ensures that requests for the same run/seat wait for one another. The waiting transaction rechecks overlap after the first transaction commits and is rejected if the segment is now occupied.

### 13.2 Transaction pseudocode

```text
FUNCTION confirmBooking(input, authenticatedActor):
    VALIDATE input
    BEGIN TRANSACTION

    LOCK service_run WHERE id = input.serviceRunId
    REQUIRE service_run.status = Open
    REQUIRE service_run.departure_time > current_time

    LOCK selected SEAT rows in ascending seat_id order
    REQUIRE every seat.transport_id = service_run.transport_id

    LOAD boarding and disembarking route stops
    LOAD service route
    REQUIRE both stops belong to service route
    REQUIRE boarding.sequence < disembarking.sequence

    CHECK overlapping confirmed, paid, non-cancelled tickets
    IF overlap exists:
        ROLLBACK
        RETURN seat_conflict

    RESOLVE passenger and identification document
    CHECK existing active ticket count for the same document and service run
    REQUIRE existing_count + requested_count <= 6

    CALCULATE authoritative fare from distance and configured policy
    REQUIRE payment amount = calculated total
    REQUIRE payment is verified successful

    INSERT payment or UPDATE pending payment to Successful
    INSERT booking with Confirmed status

    FOR each selected seat:
        INSERT ticket
        GENERATE signed QR payload
        GENERATE e-ticket PDF
        INSERT e_ticket

    COMMIT
    RETURN booking, tickets, e-ticket URLs

ON ANY ERROR:
    ROLLBACK
    DELETE any uncommitted/generated temporary PDF files
    RETURN normalized error
```

### 13.3 Express service skeleton

```js
export async function confirmBooking(command, actor) {
  const client = await pool.connect();
  const generatedFiles = [];

  try {
    await client.query('BEGIN');

    const run = await lockAndLoadServiceRun(client, command.serviceRunId);
    assertBookableRun(run);

    const seatIds = [...new Set(command.seatIds)].sort((a, b) => a - b);
    const seats = await lockSeats(client, seatIds);
    assertSeatsBelongToTransport(seats, run.transportId);

    const segment = await loadAndValidateSegment(client, {
      serviceId: run.serviceId,
      boardingStopId: command.boardingStopId,
      disembarkingStopId: command.disembarkingStopId,
    });

    await assertNoSeatOverlap(client, {
      serviceRunId: run.serviceRunId,
      seatIds,
      boardingSequence: segment.boardingSequence,
      destinationSequence: segment.destinationSequence,
    });

    await assertTicketLimit(client, {
      documentId: command.documentId,
      serviceRunId: run.serviceRunId,
      additionalTicketCount: seatIds.length,
    });

    const farePerTicket = calculateFare({
      serviceType: run.serviceType,
      distance: segment.distance,
      concession: command.concession,
      documentType: command.documentType,
    });

    const totalAmount = farePerTicket.multipliedBy(seatIds.length);
    const payment = await verifyAndRecordPayment(client, command.payment, totalAmount);

    const booking = await insertBooking(client, {
      passengerId: command.passengerId,
      paymentId: payment.paymentId,
      documentId: command.documentId,
      boardingStopId: command.boardingStopId,
      disembarkingStopId: command.disembarkingStopId,
      totalAmount,
    });

    const tickets = [];
    for (const seatId of seatIds) {
      const ticket = await insertTicket(client, {
        bookingId: booking.bookingId,
        serviceRunId: run.serviceRunId,
        seatId,
        fareAmount: farePerTicket,
        boardingInfo: segment.boardingSnapshot,
        disembarkingInfo: segment.destinationSnapshot,
      });

      const artifact = await createETicketArtifact({ ticket, booking, run, segment });
      generatedFiles.push(artifact.localPath);

      await insertETicket(client, {
        ticketId: ticket.ticketId,
        qrCode: artifact.qrPayload,
        pdfUrl: artifact.publicUrl,
      });

      tickets.push(ticket);
    }

    await client.query('COMMIT');
    return { booking, tickets };
  } catch (error) {
    await client.query('ROLLBACK');
    await Promise.allSettled(generatedFiles.map(removeFileIfExists));
    throw normalizeBookingError(error);
  } finally {
    client.release();
  }
}
```

The payment adapter must be server-verified. The browser must not be able to declare a payment successful by sending `status: "Successful"` without verification.

---

## 14. Six-Ticket Rule

BR-04 states that a passenger can hold at most six tickets per identification document per service.

For a practical date-wise reservation system, the implementation interprets this as six active tickets for one identification document on one service run. This prevents an unintended lifetime limit across every future date of the same service definition.

```sql
SELECT count(*)::integer AS active_ticket_count
FROM ticket t
JOIN booking b ON b.booking_id = t.booking_id
LEFT JOIN cancellation c ON c.ticket_id = t.ticket_id
WHERE b.document_id = $1
  AND t.service_run_id = $2
  AND b.status = 'Confirmed'
  AND c.ticket_id IS NULL;
```

The final booking transaction rejects the request when:

```text
active_ticket_count + requested_ticket_count > 6
```

This query must run after the relevant seat locks are acquired and before tickets are inserted.

---

## 15. Fare Calculation

The SRS includes `distance_from_origin`, `fare_amount`, and `total_amount` but does not define fare rates. The backend therefore calculates fare using deployment policy rather than trusting client values.

### 15.1 Distance

```text
journey_distance = destination.distance_from_origin
                 - boarding.distance_from_origin
```

The result must be greater than zero.

### 15.2 Fare policy interface

```js
export function calculateFare({ serviceType, distance, concession, documentType }) {
  const rate = getConfiguredRate(serviceType);
  let fare = Decimal(distance).mul(rate);

  if (concession === true) {
    assertSupportedConcessionDocument(documentType);
    fare = fare.mul(Decimal(100).minus(config.concessionPercent)).div(100);
  }

  return fare.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}
```

### 15.3 Fare controls

- the client may show an estimate returned by the search API;
- the final amount is recalculated inside the booking transaction;
- `booking.total_amount` must equal the sum of ticket fares;
- payment amount must equal booking total amount;
- negative fares are forbidden by both application validation and SQL checks.

---

## 16. Service Search

### 16.1 Search input

```json
{
  "boardingStopId": 101,
  "disembarkingStopId": 105,
  "travelDate": "2026-08-15",
  "passengerCount": 2
}
```

### 16.2 Validation

- both stop IDs must exist;
- both stops must belong to the same route;
- boarding sequence must be less than destination sequence;
- travel date must not be in the past;
- passenger count must be from 1 to 6;
- only open service runs are returned.

### 16.3 Search query

```sql
SELECT
    sr.service_run_id,
    sr.run_id,
    sr.departure_time,
    sr.arrival_time,
    sr.status AS service_run_status,
    s.service_id,
    s.service_name,
    s.service_type,
    r.route_id,
    r.route_name,
    tr.transport_id,
    tr.transport_number,
    tr.capacity,
    origin.route_stop_id AS boarding_stop_id,
    origin.stop_name AS boarding_stop_name,
    origin.stop_sequence AS boarding_sequence,
    destination.route_stop_id AS disembarking_stop_id,
    destination.stop_name AS disembarking_stop_name,
    destination.stop_sequence AS destination_sequence,
    destination.distance_from_origin - origin.distance_from_origin AS journey_distance
FROM route_stop origin
JOIN route_stop destination
  ON destination.route_id = origin.route_id
 AND destination.stop_sequence > origin.stop_sequence
JOIN route r
  ON r.route_id = origin.route_id
JOIN service s
  ON s.route_id = r.route_id
JOIN service_run sr
  ON sr.service_id = s.service_id
JOIN transport tr
  ON tr.transport_id = sr.transport_id
WHERE origin.route_stop_id = $1
  AND destination.route_stop_id = $2
  AND sr.status = 'Open'
  AND sr.departure_time >= $3::date
  AND sr.departure_time < ($3::date + interval '1 day')
ORDER BY sr.departure_time;
```

The service layer then attaches:

- available seat count;
- fare estimate;
- whether the run has enough seats for the requested passenger count.

---

## 17. Service-Run Generation

Operations staff creates date-wise runs from existing service and transport records.

### 17.1 Request

```json
{
  "runId": "BT-2026-08-15-001",
  "serviceId": 12,
  "transportId": 7,
  "departureTime": "2026-08-15T08:00:00+05:30",
  "arrivalTime": "2026-08-15T13:30:00+05:30",
  "status": "Open"
}
```

### 17.2 Rules

- service and transport must exist;
- service type and transport type must match;
- departure must precede arrival;
- run identifier must be unique;
- the assigned transport should not be assigned to an overlapping open run;
- the transport must have at least one seat and seat count must not exceed capacity.

### 17.3 Transport scheduling conflict query

```sql
SELECT 1
FROM service_run
WHERE transport_id = $1
  AND status <> 'Cancelled'
  AND $2::timestamptz < arrival_time
  AND $3::timestamptz > departure_time
LIMIT 1;
```

---

## 18. E-Ticket Generation

FR-09 requires:

- issue date-time;
- QR code;
- PDF URL;
- related ticket ID.

### 18.1 QR payload

The QR code should contain a signed, minimal payload rather than sensitive personal data.

```json
{
  "ticketId": 8751,
  "serviceRunId": 301,
  "bookingId": 4420,
  "issuedAt": "2026-08-01T14:20:00Z",
  "signature": "server-generated-signature"
}
```

### 18.2 PDF content

- transport type and number;
- service name and run identifier;
- departure and arrival date-time;
- boarding and disembarking stop snapshots;
- seat number;
- passenger or booking reference;
- fare;
- QR code;
- ticket ID and booking ID.

### 18.3 Atomicity note

Generate the PDF in a temporary path. Move it to the public e-ticket directory only after the database inserts succeed, or delete it during rollback. The database and filesystem cannot participate in one native PostgreSQL transaction, so the service must explicitly clean up failed artifacts.

---

## 19. Cancellation and Refund Transaction

### 19.1 Cancellation eligibility

- ticket exists;
- caller is the owning passenger, booking clerk, or authorized administrator;
- ticket is not already cancelled;
- service run is not cancelled by a different workflow without corresponding handling;
- cancellation is before departure, unless policy explicitly permits later cancellation;
- booking and ticket records are valid.

### 19.2 Refund calculation

```text
hours_before_departure = service_run.departure_time - cancellation_time
policy_band = first configured band matching hours_before_departure
refund_amount = ticket.fare_amount * policy_band.refund_percentage / 100
```

The exact percentages are configuration because the SRS does not state them.

### 19.3 Transaction pseudocode

```text
FUNCTION cancelTicket(ticketId, reason, actor):
    BEGIN TRANSACTION

    LOCK ticket and related booking, payment, service_run rows
    REQUIRE ticket exists
    REQUIRE actor is authorized
    REQUIRE no cancellation exists

    CALCULATE refund from configured policy

    INSERT cancellation
    INSERT refund

    IF every ticket in booking is now cancelled:
        UPDATE booking.status = Cancelled

    IF payment has been fully refunded:
        UPDATE payment.status = Refunded

    COMMIT
    RETURN cancellation and refund

ON ERROR:
    ROLLBACK
```

### 19.4 SQL outline

```sql
BEGIN;

SELECT
    t.ticket_id,
    t.fare_amount,
    t.booking_id,
    sr.departure_time,
    b.p_id,
    b.payment_id
FROM ticket t
JOIN booking b ON b.booking_id = t.booking_id
JOIN service_run sr ON sr.service_run_id = t.service_run_id
WHERE t.ticket_id = $1
FOR UPDATE;

SELECT 1
FROM cancellation
WHERE ticket_id = $1;

INSERT INTO cancellation(reason, ticket_id)
VALUES ($2, $1)
RETURNING cancellation_id, date_time;

INSERT INTO refund(amount, status, cancellation_id)
VALUES ($3, $4, $5)
RETURNING refund_id, amount, status, date_time;

COMMIT;
```

---

## 20. REST API Design

Base path:

```text
/api/v1
```

### 20.1 Standard response shape

Successful:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "..."
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "SEAT_SEGMENT_CONFLICT",
    "message": "One or more selected seats are no longer available.",
    "details": {
      "seatIds": [18]
    }
  },
  "meta": {
    "requestId": "..."
  }
}
```

### 20.2 Authentication and account endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create passenger user account and passenger record. |
| POST | `/auth/login` | Public | Validate credentials and issue JWT. |
| GET | `/auth/me` | Authenticated | Return account, role, and passenger profile. |
| PATCH | `/users/:userId/role` | Administrator | Change role reference. |

Registration creates `user_account` and `passenger` in one transaction. The assigned role is always Passenger unless an administrator creates a staff account.

### 20.3 Route and route-stop endpoints

| Method | Endpoint | Access |
|---|---|---|
| GET | `/routes` | Authenticated |
| POST | `/routes` | Operations Staff, Administrator |
| GET | `/routes/:routeId` | Authenticated |
| PATCH | `/routes/:routeId` | Operations Staff, Administrator |
| GET | `/routes/:routeId/stops` | Authenticated |
| POST | `/routes/:routeId/stops` | Operations Staff, Administrator |
| PATCH | `/route-stops/:routeStopId` | Operations Staff, Administrator |
| DELETE | `/route-stops/:routeStopId` | Operations Staff, Administrator, only when unreferenced |

When a route-stop sequence changes, the service must verify uniqueness and ordering. Reordering stops after bookings exist should be blocked because it changes historical segment meaning.

### 20.4 Transport and seat endpoints

| Method | Endpoint | Access |
|---|---|---|
| GET | `/transports` | Operations Staff, Administrator |
| POST | `/transports` | Operations Staff, Administrator |
| PATCH | `/transports/:transportId` | Operations Staff, Administrator |
| GET | `/transports/:transportId/seats` | Operations Staff, Administrator |
| POST | `/transports/:transportId/seats` | Operations Staff, Administrator |
| POST | `/transports/:transportId/seats/generate` | Operations Staff, Administrator |

### 20.5 Service and service-run endpoints

| Method | Endpoint | Access |
|---|---|---|
| GET | `/services` | Authenticated |
| POST | `/services` | Operations Staff, Administrator |
| PATCH | `/services/:serviceId` | Operations Staff, Administrator |
| GET | `/service-runs` | Operations Staff, Administrator |
| POST | `/service-runs` | Operations Staff, Administrator |
| PATCH | `/service-runs/:serviceRunId` | Operations Staff, Administrator |

### 20.6 Search and availability endpoints

| Method | Endpoint | Access |
|---|---|---|
| GET | `/search/service-runs` | Passenger, Booking Clerk, Administrator |
| GET | `/service-runs/:serviceRunId/seats` | Passenger, Booking Clerk, Administrator |

Example:

```text
GET /api/v1/search/service-runs?boardingStopId=101&disembarkingStopId=105&travelDate=2026-08-15&passengerCount=2
```

```text
GET /api/v1/service-runs/301/seats?boardingStopId=101&disembarkingStopId=105
```

### 20.7 Booking, ticket, and payment endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/bookings/confirm` | Passenger, Booking Clerk |
| GET | `/bookings/:bookingId` | Owner, Booking Clerk, Administrator |
| GET | `/passengers/:passengerId/bookings` | Owner, Booking Clerk, Administrator |
| GET | `/tickets/:ticketId` | Owner, Booking Clerk, Administrator |
| GET | `/tickets/:ticketId/e-ticket` | Owner, Booking Clerk, Administrator |

### 20.8 Cancellation endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/tickets/:ticketId/cancel` | Owner, Booking Clerk, Administrator |
| GET | `/cancellations/:cancellationId` | Owner, Booking Clerk, Administrator |
| GET | `/refunds/:refundId` | Owner, Booking Clerk, Administrator |

### 20.9 Report endpoints

| Method | Endpoint | Access |
|---|---|---|
| GET | `/reports/occupancy` | Administrator |
| GET | `/reports/revenue` | Administrator |
| GET | `/reports/cancellations` | Administrator |
| GET | `/reports/refunds` | Administrator |

Every report endpoint accepts a bounded date range and optional route/service filters.

---

## 21. Backend Validation Rules

Use a schema validator at the API boundary.

### 21.1 Common rules

- IDs: positive integers;
- money: decimal string or decimal-safe representation, maximum two fractional digits;
- date-time: ISO-8601;
- travel date: `YYYY-MM-DD`;
- status values: exact SRS-controlled values where specified;
- seat list: unique IDs, length 1 to 6;
- reason: required non-empty string with a reasonable maximum length;
- URLs: generated by server, not accepted as arbitrary public values from untrusted users.

### 21.2 Booking request schema

```json
{
  "passengerId": 51,
  "serviceRunId": 301,
  "boardingStopId": 101,
  "disembarkingStopId": 105,
  "seatIds": [18, 19],
  "document": {
    "documentId": 77,
    "useForConcession": false
  },
  "payment": {
    "transactionId": "TEST-PAY-000123",
    "mode": "Online"
  }
}
```

Passenger users may book only for their own `p_id`. Booking Clerks may supply another passenger ID.

---

## 22. Authentication and Security

### 22.1 Password storage

- hash passwords with a modern adaptive password hash;
- never store plain text;
- never log passwords;
- compare hashes using library functions;
- use a configurable cost factor.

### 22.2 JWT claims

```json
{
  "sub": "user-id",
  "role": "Passenger",
  "iat": 0,
  "exp": 0
}
```

The backend should still load the current user/role for sensitive operations so a role change takes effect reliably.

### 22.3 HTTP controls

- security headers;
- strict CORS origin;
- request-size limit;
- login rate limit;
- JSON-only API except approved file upload routes;
- parameterized SQL only;
- do not expose database errors directly;
- use HTTPS in production.

### 22.4 Identification document security

- accept only approved file types and maximum size;
- rename files to server-generated names;
- store outside the client source tree;
- do not use the original filename as a path;
- authorize every document retrieval through the related booking;
- never expose unrestricted directory listing.

### 22.5 E-ticket access

A PDF URL should either be:

- an authenticated download endpoint, or
- a short-lived signed URL.

A predictable public path containing only ticket IDs is not sufficient.

---

## 23. React Application Design

### 23.1 Route map

```text
/
/login
/register
/search
/search/results
/service-runs/:id/seats
/checkout
/bookings/:id
/tickets/:id
/tickets/:id/cancel

/clerk/bookings/new
/clerk/bookings/search

/operations/routes
/operations/routes/:id/stops
/operations/transports
/operations/transports/:id/seats
/operations/services
/operations/service-runs

/admin/users
/admin/reports/occupancy
/admin/reports/revenue
/admin/reports/cancellations
/admin/reports/refunds
```

### 23.2 Core pages

#### Search page

Inputs:

- boarding stop;
- disembarking stop;
- travel date;
- passenger count.

Behavior:

- destination choices must come after the selected source on the same route;
- final validation remains server-side;
- results show service type, name, run ID, departure, arrival, available seats, journey distance, and server fare estimate.

#### Seat-selection page

- fetch seat availability for the exact run and route segment;
- show available/occupied state;
- allow at most requested passenger count and never more than six;
- refresh availability immediately before proceeding;
- show that selection is not confirmed until transaction completion.

#### Checkout page

- show immutable server quote;
- select or upload identification document when required;
- show concession only when supporting document is supplied;
- submit one booking confirmation request;
- disable repeated submit while request is in progress;
- handle `SEAT_SEGMENT_CONFLICT` by returning to refreshed seat selection.

#### Booking detail page

- booking ID, date-time, status, total;
- payment status and transaction ID;
- source and destination;
- service run;
- ticket list with seat number, fare, e-ticket download, cancellation status, and refund status.

#### Operations pages

Simple CRUD forms and tables focused on database data rather than visual styling.

#### Reports pages

- date filters;
- route/service filters where applicable;
- table results;
- optional CSV export generated from the same API data.

### 23.3 React authorization guard

```jsx
function RequireRole({ allowedRoles, children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
```

This guard is for navigation only. Express authorization remains mandatory.

### 23.4 State management

Use local component state for forms and a small authentication context for current user/session. A separate global state library is not required for this DBMS project unless implementation complexity grows.

Server data should be refetched after:

- route-stop changes;
- service-run status changes;
- successful booking;
- cancellation;
- refund-status updates.

---

## 24. Reporting Queries

### 24.1 Route-wise occupancy report

Occupancy should be reported for each service run as active confirmed tickets divided by transport capacity.

```sql
SELECT
    r.route_id,
    r.route_name,
    s.service_id,
    s.service_name,
    sr.service_run_id,
    sr.run_id,
    sr.departure_time,
    tr.transport_number,
    tr.capacity,
    count(t.ticket_id) FILTER (
        WHERE b.status = 'Confirmed'
          AND p.status = 'Successful'
          AND c.cancellation_id IS NULL
    ) AS booked_ticket_count,
    round(
        100.0 * count(t.ticket_id) FILTER (
            WHERE b.status = 'Confirmed'
              AND p.status = 'Successful'
              AND c.cancellation_id IS NULL
        ) / NULLIF(tr.capacity, 0),
        2
    ) AS occupancy_percent
FROM service_run sr
JOIN service s ON s.service_id = sr.service_id
JOIN route r ON r.route_id = s.route_id
JOIN transport tr ON tr.transport_id = sr.transport_id
LEFT JOIN ticket t ON t.service_run_id = sr.service_run_id
LEFT JOIN booking b ON b.booking_id = t.booking_id
LEFT JOIN payment p ON p.payment_id = b.payment_id
LEFT JOIN cancellation c ON c.ticket_id = t.ticket_id
WHERE sr.departure_time >= $1
  AND sr.departure_time < $2
GROUP BY
    r.route_id,
    r.route_name,
    s.service_id,
    s.service_name,
    sr.service_run_id,
    sr.run_id,
    sr.departure_time,
    tr.transport_number,
    tr.capacity
ORDER BY sr.departure_time, r.route_name;
```

This report is run-level occupancy. Because the SRS emphasizes leg-wise occupancy, an advanced report may additionally calculate occupancy per route leg. That calculation uses each adjacent pair of stop sequences and counts tickets whose segments overlap that leg.

### 24.2 Revenue report

```sql
SELECT
    r.route_id,
    r.route_name,
    date_trunc('day', p.date_time) AS payment_day,
    sum(p.amount) AS successful_payment_amount
FROM payment p
JOIN booking b ON b.payment_id = p.payment_id
JOIN ticket t ON t.booking_id = b.booking_id
JOIN service_run sr ON sr.service_run_id = t.service_run_id
JOIN service s ON s.service_id = sr.service_id
JOIN route r ON r.route_id = s.route_id
WHERE p.status IN ('Successful', 'Refunded')
  AND p.date_time >= $1
  AND p.date_time < $2
GROUP BY r.route_id, r.route_name, date_trunc('day', p.date_time)
ORDER BY payment_day, r.route_name;
```

To avoid multiplying one booking payment by multiple ticket rows, production code should aggregate bookings before joining tickets or select one distinct route per booking. The booking service restricts all tickets in one booking to one service run, allowing a safe query:

```sql
WITH booking_route AS (
    SELECT DISTINCT ON (b.booking_id)
        b.booking_id,
        p.payment_id,
        p.date_time,
        p.amount,
        p.status,
        r.route_id,
        r.route_name
    FROM booking b
    JOIN payment p ON p.payment_id = b.payment_id
    JOIN ticket t ON t.booking_id = b.booking_id
    JOIN service_run sr ON sr.service_run_id = t.service_run_id
    JOIN service s ON s.service_id = sr.service_id
    JOIN route r ON r.route_id = s.route_id
)
SELECT
    route_id,
    route_name,
    sum(amount) FILTER (WHERE status IN ('Successful', 'Refunded')) AS received_amount
FROM booking_route
WHERE date_time >= $1
  AND date_time < $2
GROUP BY route_id, route_name
ORDER BY route_name;
```

A separate net-revenue result may subtract refund amounts, but the SRS revenue report specifically describes received amount based on successful payment records.

### 24.3 Cancellation report

```sql
SELECT
    c.cancellation_id,
    c.date_time AS cancellation_time,
    c.reason,
    t.ticket_id,
    b.booking_id,
    r.route_name,
    s.service_name,
    sr.run_id,
    sr.departure_time
FROM cancellation c
JOIN ticket t ON t.ticket_id = c.ticket_id
JOIN booking b ON b.booking_id = t.booking_id
JOIN service_run sr ON sr.service_run_id = t.service_run_id
JOIN service s ON s.service_id = sr.service_id
JOIN route r ON r.route_id = s.route_id
WHERE c.date_time >= $1
  AND c.date_time < $2
ORDER BY c.date_time DESC;
```

### 24.4 Refund report

```sql
SELECT
    rf.refund_id,
    rf.date_time AS refund_time,
    rf.amount,
    rf.status,
    c.cancellation_id,
    c.reason,
    t.ticket_id,
    b.booking_id
FROM refund rf
JOIN cancellation c ON c.cancellation_id = rf.cancellation_id
JOIN ticket t ON t.ticket_id = c.ticket_id
JOIN booking b ON b.booking_id = t.booking_id
WHERE rf.date_time >= $1
  AND rf.date_time < $2
ORDER BY rf.date_time DESC;
```

---

## 25. Error Codes

| Code | HTTP status | Meaning |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Request fields are missing or invalid. |
| `AUTHENTICATION_REQUIRED` | 401 | No valid authenticated user. |
| `FORBIDDEN` | 403 | Role or ownership rule failed. |
| `RESOURCE_NOT_FOUND` | 404 | Requested row does not exist. |
| `SERVICE_RUN_NOT_OPEN` | 409 | Run is closed or cancelled. |
| `SERVICE_RUN_DEPARTED` | 409 | Booking/cancellation timing is invalid. |
| `INVALID_ROUTE_SEGMENT` | 409 | Stops are on different routes or in the wrong order. |
| `SEAT_TRANSPORT_MISMATCH` | 409 | Seat does not belong to assigned transport. |
| `SEAT_SEGMENT_CONFLICT` | 409 | Seat is already sold on an overlapping segment. |
| `TICKET_LIMIT_EXCEEDED` | 409 | More than six active tickets would be held by the identification document. |
| `PAYMENT_NOT_SUCCESSFUL` | 409 | Payment has not been verified successful. |
| `PAYMENT_AMOUNT_MISMATCH` | 409 | Payment does not equal the authoritative total. |
| `TICKET_ALREADY_CANCELLED` | 409 | Cancellation already exists. |
| `REFUND_POLICY_MISSING` | 500 | Required cancellation policy configuration is absent. |
| `DATABASE_TRANSACTION_FAILED` | 500 | Atomic operation failed and was rolled back. |

---

## 26. Transaction Boundaries

| Operation | Transaction contents |
|---|---|
| Passenger registration | Create user account, assign Passenger role, create passenger. |
| Seat generation | Lock transport, verify capacity, insert seats. |
| Service-run creation | Validate service/transport, check run conflict, insert service run. |
| Booking confirmation | Locks, overlap recheck, limit check, payment success, booking, tickets, e-tickets. |
| Ticket cancellation | Lock ticket, create cancellation, create refund, update booking/payment status when applicable. |
| Role change | Validate role and update user account. |

No route, service, seat, or ticket write should be partially committed when dependent writes fail.

---

## 27. Testing Strategy

### 27.1 Unit tests

- fare calculation using configured rates;
- distance calculation;
- route-segment overlap truth table;
- refund-band selection;
- password hashing and comparison;
- role authorization matrix;
- request validation;
- money rounding.

### 27.2 Database integration tests

- duplicate role name rejected;
- duplicate route-stop sequence rejected within one route;
- same sequence allowed on different routes;
- duplicate seat number rejected within one transport;
- same seat number allowed on different transports;
- booking without passenger rejected;
- ticket without booking/service run/seat rejected;
- seat from wrong transport rejected;
- e-ticket duplication for one ticket rejected;
- second cancellation for one ticket rejected;
- refund without cancellation rejected;
- negative amounts rejected;
- invalid statuses rejected.

### 27.3 Seat-overlap tests

Assume route sequences A=1, B=2, C=3, D=4.

| Existing | Requested | Expected |
|---|---|---|
| A-B | B-C | Allowed |
| A-C | B-D | Rejected |
| B-D | A-C | Rejected |
| A-D | B-C | Rejected |
| C-D | A-B | Allowed |
| A-C cancelled | B-D | Allowed after cancellation transaction commits |

### 27.4 Concurrency test

Run two booking confirmations concurrently for the same service run, seat, and overlapping segment.

Expected result:

- one transaction commits;
- one returns `SEAT_SEGMENT_CONFLICT`;
- database contains one confirmed active ticket for the conflicting segment;
- no orphan booking, payment, or e-ticket rows remain from the failed request.

### 27.5 Rollback tests

Inject failure after each step:

- payment update;
- booking insert;
- first ticket insert;
- later ticket insert;
- e-ticket row insert.

Expected result: no partial confirmed booking data.

### 27.6 API authorization tests

- Passenger cannot create routes;
- Booking Clerk cannot view administrator reports;
- Operations Staff can manage routes and runs;
- Administrator can view reports;
- Passenger cannot read another passenger's booking;
- Booking Clerk can retrieve booking details needed for service;
- unauthenticated calls to protected endpoints return 401.

### 27.7 Acceptance tests mapped to the SRS

| Acceptance criterion | Test |
|---|---|
| Master data is stored | Create and read route, route stops, service, service run, transport, and seats. |
| Search by valid stops/date | Search returns only runs on the same route where source precedes destination and date matches. |
| No overlapping double booking | Concurrent and sequential overlap tests reject conflict and allow adjacent segment reuse. |
| Booking linkage | Inspect FKs from booking to payment/passenger/document/stops and tickets to booking/run/seat. |
| Cancellation/refund linkage | Cancel ticket and verify one cancellation plus one linked refund. |
| Reports | Compare occupancy and revenue results to seeded expected totals. |
| Role control | Execute endpoint matrix with all four roles. |

---

## 28. Seed Data

Seed only stable reference data and a small demonstrable scenario.

### 28.1 Roles

```sql
INSERT INTO role(role_name) VALUES
('Passenger'),
('Booking Clerk'),
('Operations Staff'),
('Administrator');
```

### 28.2 Demonstration route

```text
Route: City A - City D
Stops:
1. City A, distance 0
2. City B, distance 50
3. City C, distance 110
4. City D, distance 180
```

### 28.3 Demonstration transport

```text
Transport type: Bus
Transport number: BUS-001
Capacity: 6
Seats: 1A, 1B, 2A, 2B, 3A, 3B
```

### 28.4 Demonstration service/run

- one Bus service on the route;
- one future Open service run using BUS-001;
- test passengers and staff accounts with development-only passwords documented outside production seed files.

---

## 29. Logging and Auditability

The SRS requires auditable times for booking, payment, cancellation, and refund. Those timestamps are stored in the relevant tables.

Application logs should additionally contain:

- request ID;
- authenticated user ID and role;
- operation name;
- affected business record IDs;
- result code;
- duration;
- safe error summary.

Do not log:

- passwords;
- JWTs;
- full identification-document contents;
- payment secrets;
- unnecessary personal details.

---

## 30. Performance Requirements

### 30.1 Main performance paths

- service search;
- seat availability;
- final booking overlap check;
- passenger booking history;
- occupancy and revenue reports.

### 30.2 Performance controls

- use the indexes listed above;
- return paginated booking and report results;
- limit report date ranges;
- use one SQL query instead of per-seat repeated queries where possible;
- lock only the service run and selected seats, not the entire ticket table;
- use a bounded PostgreSQL connection pool;
- run `EXPLAIN (ANALYZE, BUFFERS)` on search and report queries with representative data;
- archive or partitioning is unnecessary for the initial academic scope unless data becomes large.

### 30.3 Expected query behavior

- service search should use `idx_service_run_search`;
- availability should use `idx_ticket_run_seat`, booking FKs, and route-stop PK lookups;
- passenger history should use `idx_booking_passenger_time`;
- revenue should use `idx_payment_status_time`.

---

## 31. Reliability, Backup, and Recovery

### 31.1 Database backup

- regular logical backup with `pg_dump`;
- retain multiple dated backups;
- protect backup credentials;
- test restoration, not only backup creation;
- back up file-storage directories with matching retention.

Example:

```bash
pg_dump --format=custom --file=backup/reservation_YYYYMMDD.dump "$DATABASE_URL"
```

### 31.2 Recovery verification

A recovery test must verify:

- all tables and constraints restore;
- booking/payment/ticket links remain valid;
- e-ticket files referenced by `pdf_url` are present;
- reports produce expected seeded totals.

### 31.3 Application reliability

- terminate startup if migrations are pending in controlled deployment;
- handle process shutdown by closing HTTP server and database pool;
- do not retry non-idempotent booking confirmation blindly;
- use a client-generated idempotency key for repeated booking-submit protection, maintained temporarily by the server or gateway layer without adding a new business entity to the DBMS model.

---

## 32. Implementation Phases

### Phase 1 - Database foundation

- create migrations;
- create roles and seed data;
- add constraints, indexes, and triggers;
- write data-access integration tests.

### Phase 2 - Authentication and RBAC

- register/login;
- password hashing;
- JWT middleware;
- role middleware;
- user/passenger ownership checks.

### Phase 3 - Operations master data

- route and route-stop CRUD;
- transport and seat CRUD/generation;
- service CRUD;
- service-run creation and status management.

### Phase 4 - Search and seat availability

- source/destination validation;
- date-wise search;
- seat map;
- overlap query;
- fare estimate.

### Phase 5 - Booking transaction

- payment adapter;
- final lock and recheck;
- six-ticket rule;
- booking/ticket inserts;
- QR and PDF generation;
- rollback cleanup;
- concurrency tests.

### Phase 6 - Cancellation and refund

- configurable refund policy;
- cancellation transaction;
- refund record;
- booking/payment status adjustment;
- cancellation tests.

### Phase 7 - Reports

- occupancy;
- revenue;
- cancellation;
- refund;
- administrator screens and CSV export.

### Phase 8 - Hardening and deployment

- security headers and rate limits;
- backup scripts;
- production environment configuration;
- performance testing;
- full acceptance test run.

---

## 33. Requirement Traceability Matrix

| Requirement | Database | Backend | React | Verification |
|---|---|---|---|---|
| FR-01 Route and stop management | `route`, `route_stop` | Route module | Operations route pages | CRUD and sequence tests |
| FR-02 Service definition | `service`, `transport`, `seat` | Service/transport modules | Operations forms | Type and capacity tests |
| FR-03 Service-run generation | `service_run` | Service-run module | Run form/list | Type, time, conflict tests |
| FR-04 Service search | Route/service/run joins | Search service | Search/results pages | Source-before-destination tests |
| FR-05 Seat selection | `seat`, `ticket.seat_id` | Availability and locking | Seat-selection page | Overlap and concurrency tests |
| FR-06 Booking creation | `booking` | Booking service | Checkout | Transaction-link tests |
| FR-07 Payment recording | `payment` | Payment adapter | Checkout/payment state | Amount/status tests |
| FR-08 Ticket generation | `ticket` | Ticket service | Booking detail | FK and fare tests |
| FR-09 E-ticket issue | `e_ticket` | PDF/QR service | Download action | One-to-one and file tests |
| FR-10 Cancellation | `cancellation` | Cancellation service | Cancel page | Duplicate-cancel test |
| FR-11 Refund | `refund` | Refund policy/service | Refund status | Transaction and amount test |
| FR-12 Reports | Aggregate queries | Report service | Admin report pages | Seeded expected totals |
| BR-01 No overlapping resale | Ticket/run/seat indexes | Lock + overlap recheck | Conflict display | Concurrent conflict test |
| BR-02 Later segment reuse | Sequence comparison | Half-open interval rule | Availability refresh | A-B then B-C allowed |
| BR-03 Time-based charge | `refund.amount`, timestamps | Configured policy | Cancellation preview | Band boundary tests |
| BR-04 Six-ticket limit | Booking/document/ticket joins | Transactional count | Seat limit in UI | Existing + requested count test |
| BR-05 Concession document | `booking.document_id` | Document validation | Upload/select document | Missing-document rejection |
| BR-06 Valid booking/payment required | FKs and status checks | Booking transaction | Success-only e-ticket | Failed-payment rollback test |
| BR-07 Refund requires cancellation | FK and unique constraint | Cancellation transaction | Refund display | Orphan-refund rejection |

---

## 34. Known Ambiguities and Controlled Decisions

These items are not fully specified by the source documents and must remain explicit rather than hidden in code.

| Ambiguity | Controlled implementation decision |
|---|---|
| Fare rates | Environment/configuration policy; no source-specific numeric rate is assumed. |
| Cancellation percentages | Environment/configuration policy; no percentage is invented. |
| Service status values | Store a required status string; application uses a documented small value set. The SRS only explicitly constrains service-run status. |
| Refund status values | Store a required status string; project owner defines operational values. |
| Six tickets "per service" | Implement per service run to avoid a lifetime limit across dates. |
| Identification-document ownership | Access only through authorized bookings; schema has no passenger FK on the document. |
| Payment gateway | Use a server-verified adapter or academic mock. Browser cannot self-declare success. |
| Seat hold before payment | No seat-hold entity exists. Final availability is guaranteed only in booking confirmation. |
| Multiple service runs in one booking | Booking API restricts one booking to one service run, matching a single journey and simplifying correct totals/reports. |

Any change that introduces a new table, business role, or workflow must be handled as a formal SRS/schema revision rather than silently added.

---

## 35. Definition of Done

The implementation is complete only when all of the following are true:

- all supplied entities exist with documented keys and foreign keys;
- the two mandatory schema-completion fields are present and reflected in the final project ER/schema;
- all controlled status and amount constraints are enforced;
- all four roles are seeded and enforced in Express;
- operations staff can create route, stops, service, transport, seats, and service run;
- Passenger and Booking Clerk can search valid runs;
- source stop must precede destination stop;
- seat availability is segment-aware;
- adjacent non-overlapping reuse is allowed;
- concurrent overlapping booking attempts cannot both succeed;
- booking, successful payment, tickets, and e-tickets are linked correctly;
- six-ticket rule is enforced inside the final transaction;
- cancellation and refund are atomic;
- administrator reports match seeded expected data;
- transaction failure leaves no partial rows;
- passwords are hashed;
- document and e-ticket access is authorized;
- backups can be restored;
- all acceptance tests pass.

---

## 36. Final Implementation Principle

The core correctness rule is:

> A booking is not confirmed because the React page displayed an available seat. It is confirmed only when the Express booking service, inside a PostgreSQL transaction, locks the selected service-run seats, rechecks the requested route segment, validates payment and ticket limits, creates all linked records, and commits successfully.

This principle directly protects the central DBMS requirement: one seat may be reused on non-overlapping legs, but it must never be sold twice on overlapping legs of the same service run.
