# Simandaya Web

Full-stack monorepo application with FastAPI backend, Next.js frontend, and PostgreSQL database.

## Architecture

```
simandaya-web/
├── backend/              # FastAPI REST API
│   ├── app/
│   │   ├── config/       # Settings and database configuration
│   │   ├── models/       # SQLAlchemy models
│   │   ├── dto/          # Data Transfer Objects (Pydantic)
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities (JWT, password hashing)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # Next.js 14 (App Router)
│   ├── app/              # Pages and layouts
│   ├── lib/              # Redux store and features
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml    # Service orchestration
└── .env.example          # Environment variables template
```

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy 2.0** - Async ORM
- **PostgreSQL 16** - Database
- **Pydantic v2** - Data validation
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing

### Frontend
- **Next.js 14** - React framework (App Router)
- **Redux Toolkit** - State management
- **RTK Query** - Data fetching
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Quick Start (Docker)

1. **Clone and setup environment:**
   ```bash
   git clone <repository-url>
   cd simandaya-web
   cp .env.example .env
   # Edit .env and change JWT_SECRET_KEY and DB_PASSWORD
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Access applications:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

4. **View logs:**
   ```bash
   docker-compose logs -f
   docker-compose logs backend
   docker-compose logs frontend
   ```

5. **Stop services:**
   ```bash
   docker-compose down
   docker-compose down -v  # Also remove volumes
   ```

## Local Development

### Backend Development

1. **Create virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start PostgreSQL (Docker):**
   ```bash
   docker run -d --name postgres-dev \
     -e POSTGRES_USER=simandaya \
     -e POSTGRES_PASSWORD=simandaya_dev \
     -e POSTGRES_DB=simandaya_db \
     -p 5432:5432 \
     postgres:16-alpine
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit backend/.env with your settings
   ```

5. **Run development server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Development

1. **Install dependencies:**
   ```bash
   cd frontend
   pnpm install  # or npm install
   ```

2. **Configure environment:**
   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   ```

3. **Run development server:**
   ```bash
   pnpm dev  # or npm run dev
   ```

4. **Access application:**
   - Frontend: http://localhost:3000
   - Login: http://localhost:3000/login
   - Signup: http://localhost:3000/signup

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Create new account | No |
| POST | `/login` | Login with credentials | No |
| GET | `/verify` | Verify JWT token | Yes |
| POST | `/logout` | Logout user | Yes |

### Request/Response Examples

**Signup:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test1234"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test1234"
  }'
```

**Verify Token:**
```bash
curl -X GET http://localhost:8000/api/v1/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Environment Variables

See `.env.example` for all available configuration options.

### Critical Settings (Change in Production!)

- `JWT_SECRET_KEY` - Secret key for JWT signing (min 32 chars)
- `DB_PASSWORD` - PostgreSQL password
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 12)

## Production Deployment

1. **Update environment variables:**
   - Set strong `JWT_SECRET_KEY`
   - Set secure `DB_PASSWORD`
   - Set `ENVIRONMENT=production`

2. **Build and run:**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

3. **Setup reverse proxy (Nginx/Caddy):**
   - Frontend: Port 3000
   - Backend API: Port 8000

4. **Enable HTTPS:**
   - Use Let's Encrypt with Certbot
   - Or use Cloudflare

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `docker-compose ps`
- Check logs: `docker-compose logs backend`
- Verify `.env` file exists with correct values

### Frontend won't connect to backend
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Check CORS settings in `backend/app/main.py`
- Ensure backend is running: `curl http://localhost:8000/health`

### Database connection errors
- Check PostgreSQL health: `docker-compose ps postgres-db`
- Verify credentials in `.env` match
- Check network connectivity: `docker network ls`
