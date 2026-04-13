# Cafe Ordering System

A modular ordering system for small cafes, diners, and bars.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Run with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Customer App | http://localhost:8080 | Order placement |
| Kitchen Display | http://localhost:8080/kitchen | Kitchen view |
| Pickup Display | http://localhost:8080/pickup | Ready orders |
| Admin Portal | http://localhost:8080/admin | Menu & inventory |
| API | http://localhost:3000/api | REST API |

### Local Development

```bash
# Backend
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Test

```bash
cd backend
npm test
```

## Architecture

- **Frontend**: React + Vite
- **Backend**: Node.js Express (Modular Monolith)
- **Database**: PostgreSQL
- **Real-time**: Socket.io
