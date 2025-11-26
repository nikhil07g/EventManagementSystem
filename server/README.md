# Backend (Express + MongoDB)

This folder contains a minimal Express backend that uses MongoDB (via Mongoose) for data storage.

Quick start (from `server/`):

1. Copy the env file and set your connection string:

   cp .env.example .env
   # then edit .env and set MONGODB_URI

2. Install dependencies:

   npm install

3. Start the server (development with nodemon):

   npm run dev

The server exposes:

- GET  /api/health
- GET  /api/events
- POST /api/events
- GET  /api/events/:id
- GET  /api/bookings
- POST /api/bookings

Notes
- This is a minimal scaffold. Expand models, validation, authentication, and error handling for production use.
