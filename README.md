# ecom-dynamic-catalog-system

Dynamic e-commerce catalog prototype with a React frontend and an Express backend. Uses an in-memory store — no database setup required.

## Tech Stack

| Layer     | Technology                        | Port |
|-----------|-----------------------------------|------|
| Backend   | Node.js + Express 5               | 3001 |
| Frontend  | React 19 + Vite 6                 | 5173 |
| Store     | In-memory (no DB required)        | —    |
| Tests     | Jest (backend), Vitest + RTL (frontend) | — |

## Prerequisites

- Node.js ≥ 18 (developed on v22)
- npm

## Setup

```bash
git clone https://github.com/akshay1027/ecom-dynamic-catelog-system.git
cd ecom-dynamic-catelog-system

# Install dependencies for each service
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Running

Open two terminals from the project root:

```bash
# Terminal 1 — backend
npm run dev:backend
# Starts on http://localhost:3001
# Seed data loads automatically on startup

# Terminal 2 — frontend
npm run dev:frontend
# Opens on http://localhost:5173
```

## API

Base URL: `http://localhost:3001/api/v1/products`

## Testing

```bash
npm test               # run all tests (backend + frontend)
npm run test:backend   # Jest only
npm run test:frontend  # Vitest only
```
