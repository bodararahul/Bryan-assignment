# Lead Manager CRM

A full-stack lead management application built with React, Node.js/Express, and PostgreSQL (Supabase).

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v3, Axios, react-hot-toast
- **Backend:** Node.js, Express, TypeScript, express-validator, helmet, morgan
- **Database:** PostgreSQL (cloud-hosted on Supabase via Connection Pooler) with SQLite support
- **Security:** Parameterized SQL queries (preventing SQL injection), Helmet.js security headers, CORS restriction, XSS-safe input sanitization & validation via `express-validator`

## Prerequisites

- Node.js >= 18
- npm >= 9

## Setup and Run

### 1. Backend

```bash
cd backend
npm install
# .env is pre-configured with Supabase credentials
npm run dev
```

The API will start on http://localhost:3001

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will open on http://localhost:5173

## Features

- **Create Lead:** Form with name, email (validated), phone, notes
- **View Leads:** Table sorted newest first with pagination (10 per page)
- **Update Status:** Inline status dropdown (New / Contacted / Qualified / Closed)
- **Search:** Debounced real-time search by name or email
- **Filter:** Filter by lead status via dropdown
- **Delete:** Delete with animated confirmation modal
- **Validation:** Client-side real-time + server-side with express-validator
- **Error Handling:** Toast notifications for all success/failure states
- **Stats Dashboard:** Live counts of leads by status
- **Security:** SQL injection protected via parameterized pg queries

## API Endpoints

| Method | Endpoint                 | Description                    |
|--------|--------------------------|--------------------------------|
| GET    | /api/leads               | List leads (search/filter/page)|
| POST   | /api/leads               | Create a new lead              |
| PATCH  | /api/leads/:id/status    | Update lead status             |
| DELETE | /api/leads/:id           | Delete a lead                  |
| GET    | /health                  | API health check               |

## Project Structure

```
Bryan-assignment/
├── backend/           Node.js/Express REST API
├── frontend/          React + Vite SPA
├── README.md
```
