# Bus and Train Reservation System

DBMS project built with PERN stack (PostgreSQL, Express, React, Node.js). This project is for our university database course.

## What's Working So Far

- User registration and login (with JWT tokens)
- Role-based access: Passenger, Booking Clerk, Operations Staff, Administrator
- Route and stop management (add/edit/delete)
- Transport management with seat generation
- Service and service-run creation
- Search for trips between any two stops on a given date
- Seat availability view (shows which seats are free for your segment)
- Booking creation with payment recording
- Tickets and e-tickets (kinda basic rn)
- Cancellation with partial refund

## Still Needs Work (TODOs)

- [ ] Proper seat locking to prevent double booking (right now it's just a simple check)
- [ ] Six-ticket limit per person per service run
- [ ] Connect admin reports to actual API data (currently just placeholder UI)
- [ ] Generate actual PDF e-tickets (right now it stores URLs but doesn't generate files)
- [ ] File upload for ID documents
- [ ] Rate limiting on login
- [ ] Better error handling in some places
- [ ] Fix the constants - role names don't match between code and database lol

## Setup (if you want to run it)

You need Node.js 18+ and PostgreSQL 14+ installed.

```bash
git clone https://github.com/Vivek-GuptaXCode/bus-train-reservation-system.git
cd bus-train-reservation-system

# install everything
npm run install:all

# copy the env file and put your own values
cp .env.example .env

# set up database
npm run migrate
npm run seed

# run both server and client
npm run dev
```

The server runs on port 5000 and the React app on port 5173.

## Default Login

username: admin  
password: admin123  
role: Administrator

(other users are in the seed file, check database/seeds/001_seed_data.sql)

## Project Structure

```
bus-train-reservation-system/
├── client/            # React frontend (built with Vite)
│   └── src/
│       ├── api/       # API call functions
│       ├── components/# Reusable UI parts
│       ├── contexts/  # Auth context for login state
│       └── pages/     # All the page components
├── server/            # Express API backend
│   └── src/
│       ├── config/    # Environment and business rules
│       ├── db/        # Database connection and migration scripts
│       ├── middleware/ # Auth, validation, error handling
│       ├── modules/   # Route handlers and database queries
│       └── shared/    # Error classes and constants
├── database/
│   ├── migrations/    # SQL to create all tables
│   └── seeds/         # Sample data for testing
└── storage/           # Uploaded docs and e-tickets (empty for now)
```

## API Endpoints (main ones)

Everything is under `/api/v1`:

- POST `/auth/register` - sign up
- POST `/auth/login` - get token
- GET `/auth/me` - current user info
- GET `/routes` - list all routes
- POST `/routes` - create route (ops/admin only)
- GET `/search/service-runs?boardingStopId=X&disembarkingStopId=Y&travelDate=Z` - find trips
- GET `/service-runs/:id/seats` - view seat map
- POST `/bookings/confirm` - book tickets
- POST `/tickets/:id/cancel` - cancel a ticket

There are more endpoints for managing transports, services, and service runs. Check the route files in server/src/modules/ for details.

## Database

16 tables with foreign keys and triggers. The schema is in `database/migrations/001_initial_schema.sql`. Used ChatGPT and some YouTube tutorials to figure out the triggers for transport-service type matching.

## Notes

- This is an academic project, not production code
- Some parts are simplified on purpose (we haven't covered everything in class yet)
- The booking doesn't do proper concurrency locking - it'll fail if two people try to book the same seat at once
- Planning to fix that before the final submission
