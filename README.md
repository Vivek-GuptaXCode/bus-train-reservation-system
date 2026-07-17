# Bus and Train Reservation System

A full-stack reservation system built with **PostgreSQL, Express.js, React, and Node.js** (PERN stack) as part of a DBMS academic project.

## Project Status

> This project is currently **in progress**. Core database schema, authentication, master data management, service search, and seat availability functionality are implemented. Booking transactions and reporting are under development.

## Tech Stack

| Layer    | Technology                    |
| -------- | ----------------------------- |
| Database | PostgreSQL                    |
| Backend  | Node.js + Express.js          |
| Frontend | React (Vite)                  |
| Auth     | JWT + bcryptjs                |

## Features Implemented

- User registration/login with role-based access (Passenger, Booking Clerk, Operations Staff, Administrator)
- Route and route-stop management (CRUD)
- Transport and seat management with capacity validation
- Service and service-run creation with type-compatibility checks
- Service search by source, destination, and travel date
- Leg-wise seat availability display
- Booking creation with payment recording
- Ticket and e-ticket generation
- Ticket cancellation with refund calculation
- Database triggers for referential integrity
- RESTful API with input validation

## Project Structure

```
bus-train-reservation-system/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── api/               # API client modules
│       ├── app/               # App entry and routing
│       ├── components/        # Reusable components
│       ├── contexts/          # React contexts (Auth)
│       └── pages/             # Page components
├── server/                    # Express.js backend
│   └── src/
│       ├── config/            # Environment and policy config
│       ├── db/                # Database pool and migrations
│       ├── middleware/        # Auth, validation, error handling
│       ├── modules/           # Route handlers and services
│       └── shared/            # Shared utilities
├── database/
│   ├── migrations/            # SQL schema files
│   └── seeds/                 # Seed data
└── storage/                   # Uploaded documents and e-tickets
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/Vivek-GuptaXCode/bus-train-reservation-system.git
cd bus-train-reservation-system

# Install dependencies
npm run install:all

# Copy environment config
cp .env.example .env
# Edit .env with your database credentials and secrets

# Set up the database
npm run migrate
npm run seed

# Start development servers
npm run dev
```

### Default Users (from seed data)

| Username  | Password   | Role              |
| --------- | ---------- | ----------------- |
| passenger | pass123    | Passenger         |
| clerk     | clerk123   | Booking Clerk     |
| ops       | ops123     | Operations Staff  |
| admin     | admin123   | Administrator     |

## API Endpoints

Base URL: `/api/v1`

| Method | Endpoint                        | Access        | Description            |
| ------ | ------------------------------- | ------------- | ---------------------- |
| POST   | /auth/register                  | Public        | Register new user      |
| POST   | /auth/login                     | Public        | Login and get JWT      |
| GET    | /auth/me                        | Authenticated | Get current user       |
| GET    | /routes                         | Authenticated | List routes            |
| POST   | /routes                         | Ops, Admin    | Create route           |
| GET    | /search/service-runs            | Passenger+   | Search services        |
| GET    | /service-runs/:id/seats         | Passenger+   | View seat availability |
| POST   | /bookings/confirm               | Passenger+   | Confirm booking        |
| GET    | /bookings/:id                   | Owner+       | View booking           |
| POST   | /tickets/:id/cancel             | Owner+       | Cancel ticket          |

## Database Schema

The system uses 16 relational tables with full referential integrity:

`role` → `user_account` → `passenger` → `booking` → `ticket` → `e_ticket`

`route` → `route_stop` (used by booking for boarding/disembarking)

`service` → `service_run` (linked to tickets and transport)

`transport` → `seat` (assigned per ticket)

`booking` → `payment`, `identification_document`

`ticket` → `cancellation` → `refund`

## License

This project is created for academic purposes as part of a DBMS course.
