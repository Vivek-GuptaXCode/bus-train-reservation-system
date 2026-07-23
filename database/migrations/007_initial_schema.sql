
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
