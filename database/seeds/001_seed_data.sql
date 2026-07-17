-- ============================================================================
-- Seed: 001_seed_data
-- Description: Populates the database with initial demo data
-- Author: Student Project
-- Date: July 2026
-- ============================================================================
-- This script inserts sample records so we can test the application.
-- All IDs are auto-generated, so we use subqueries for foreign key references.
-- TODO: Add more realistic sample data like actual bookings and payments
-- FIXME: Hardcoded times might need to be dynamic for demo purposes

BEGIN;

-- ============================================================================
-- 1. ROLES
-- Insert all four system roles (these must match the CHECK constraint on role)
-- ============================================================================
INSERT INTO role (role_name) VALUES ('Passenger');
INSERT INTO role (role_name) VALUES ('Booking Clerk');
INSERT INTO role (role_name) VALUES ('Operations Staff');
INSERT INTO role (role_name) VALUES ('Administrator');

-- Verify all roles are inserted (should be 4)
-- role_id will be 1, 2, 3, 4 because GENERATED ALWAYS AS IDENTITY starts at 1

-- ============================================================================
-- 2. ROUTE
-- A demo route from City A to City D, passing through B and C
-- total_distance is 180 km (A->B: 50, B->C: 60, C->D: 70)
-- ============================================================================
INSERT INTO route (route_name, total_distance)
VALUES ('City A - City D', 180);

-- ============================================================================
-- 3. ROUTE STOPS
-- Four stops along the route. Each has a sequence number and distance from start.
-- Departure and arrival times indicate the timetable for this route.
-- We use subqueries to find the route_id by name.
-- ============================================================================

-- Stop 1: City A (origin — only departure time, no arrival)
INSERT INTO route_stop (stop_name, stop_sequence, distance_from_origin, arrival_time, departure_time, route_id)
VALUES (
    'City A',
    1,
    0,
    NULL,                                   -- No arrival at the origin
    '08:00:00',                             -- Depart at 8 AM
    (SELECT route_id FROM route WHERE route_name = 'City A - City D')
);

-- Stop 2: City B (arrive 9:00, depart 9:15 — 15 min halt for passengers)
INSERT INTO route_stop (stop_name, stop_sequence, distance_from_origin, arrival_time, departure_time, route_id)
VALUES (
    'City B',
    2,
    50,
    '09:00:00',
    '09:15:00',
    (SELECT route_id FROM route WHERE route_name = 'City A - City D')
);

-- Stop 3: City C (arrive 10:00, depart 10:15 — another 15 min halt)
INSERT INTO route_stop (stop_name, stop_sequence, distance_from_origin, arrival_time, departure_time, route_id)
VALUES (
    'City C',
    3,
    110,
    '10:00:00',
    '10:15:00',
    (SELECT route_id FROM route WHERE route_name = 'City A - City D')
);

-- Stop 4: City D (destination — only arrival time, no departure)
INSERT INTO route_stop (stop_name, stop_sequence, distance_from_origin, arrival_time, departure_time, route_id)
VALUES (
    'City D',
    4,
    180,
    '11:00:00',                             -- Arrive at 11 AM
    NULL,                                   -- End of route, no departure
    (SELECT route_id FROM route WHERE route_name = 'City A - City D')
);

-- ============================================================================
-- 4. SERVICES
-- Two services on the same route: one Bus and one Train
-- Both are currently Active (available for booking)
-- ============================================================================

-- Bus Service
INSERT INTO service (service_name, service_type, status, route_id)
VALUES (
    'City Bus Service',
    'Bus',
    'Active',
    (SELECT route_id FROM route WHERE route_name = 'City A - City D')
);

-- Train Service
INSERT INTO service (service_name, service_type, status, route_id)
VALUES (
    'City Train Express',
    'Train',
    'Active',
    (SELECT route_id FROM route WHERE route_name = 'City A - City D')
);

-- ============================================================================
-- 5. TRANSPORT VEHICLES
-- One bus and one train, each with a unique number and fixed capacity.
-- ============================================================================

-- Bus with capacity 6 (small bus for testing)
INSERT INTO transport (transport_type, transport_number, capacity)
VALUES ('Bus', 'BUS-001', 6);

-- Train with capacity 8 (small train for testing)
INSERT INTO transport (transport_type, transport_number, capacity)
VALUES ('Train', 'TRAIN-001', 8);

-- ============================================================================
-- 6. SEATS
-- Each transport vehicle has seats. We number them like real bus/train seats.
-- Bus seats: 1A, 1B, 2A, 2B, 3A, 3B (6 seats total)
-- Train seats: A1, A2, B1, B2, C1, C2, D1, D2 (8 seats total)
-- ============================================================================

-- --- BUS-001 seats (6 seats) ---
INSERT INTO seat (seat_no, transport_id)
VALUES ('1A', (SELECT transport_id FROM transport WHERE transport_number = 'BUS-001'));
INSERT INTO seat (seat_no, transport_id)
VALUES ('1B', (SELECT transport_id FROM transport WHERE transport_number = 'BUS-001'));
INSERT INTO seat (seat_no, transport_id)
VALUES ('2A', (SELECT transport_id FROM transport WHERE transport_number = 'BUS-001'));
INSERT INTO seat (seat_no, transport_id)
VALUES ('2B', (SELECT transport_id FROM transport WHERE transport_number = 'BUS-001'));
INSERT INTO seat (seat_no, transport_id)
VALUES ('3A', (SELECT transport_id FROM transport WHERE transport_number = 'BUS-001'));
INSERT INTO seat (seat_no, transport_id)
VALUES ('3B', (SELECT transport_id FROM transport WHERE transport_number = 'BUS-001'));

-- --- TRAIN-001 seats (8 seats) ---
INSERT INTO seat (seat_no, transport_id)
VALUES ('A1', (SELECT transport_id FROM transport WHERE transport_number = 'TRAIN-001'));
INSERT INTO seat (seat_no, transport_id)
VALUES ('A2', (SELECT transport_id FROM transport WHERE transport_number = 'TRAIN-001'));
INSERT INTO seat (seat_no, transport_id)
VALUES ('B1', (SELECT transport_id FROM transport WHERE transport_number = 'TRAIN-001'));
INSERT INTO seat (seat_no, transport_id)
VALUES ('B2', (SELECT transport_id FROM transport WHERE transport_number = 'TRAIN-001'));
INSERT INTO seat (seat_no, transport_id)
VALUES ('C1', (SELECT transport_id FROM transport WHERE transport_number = 'TRAIN-001'));
INSERT INTO seat (seat_no, transport_id)
VALUES ('C2', (SELECT transport_id FROM transport WHERE transport_number = 'TRAIN-001'));
INSERT INTO seat (seat_no, transport_id)
VALUES ('D1', (SELECT transport_id FROM transport WHERE transport_number = 'TRAIN-001'));
INSERT INTO seat (seat_no, transport_id)
VALUES ('D2', (SELECT transport_id FROM transport WHERE transport_number = 'TRAIN-001'));

COMMIT;

-- Seed data complete! We now have:
--   4 roles, 1 route, 4 route stops, 2 services, 2 transports, 14 seats
-- Ready to create users, bookings, and tickets next.
