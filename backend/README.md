# Simandaya Backend

FastAPI REST API with username/password authentication.

## Directory Structure

```
backend/
├── app/
│   ├── config/           # Configuration
│   │   ├── settings.py   # Pydantic settings (env vars)
│   │   └── database.py   # SQLAlchemy async setup
│   ├── models/           # Database models
│   │   └── user.py       # User model (username + password_hash)
│   ├── dto/              # Data Transfer Objects
│   │   └── auth/         # Auth DTOs
│   │       ├── auth_request.py   # Signup/Login requests
│   │       └── auth_response.py  # Token/User responses
│   ├── routers/          # API endpoints
│   │   └── auth.py       # /api/v1/auth routes
│   ├── services/         # Business logic
│   │   └── auth_service.py  # Auth operations
│   ├── utils/            # Utilities
│   │   ├── jwt_utils.py        # JWT manager
│   │   └── password_utils.py   # Bcrypt wrapper
│   └── main.py           # FastAPI app entry
├── Dockerfile
└── requirements.txt
```

## Key Patterns (CLAUDE.md Compliance)

### Dependency Injection
```python
# CORRECT - Use class, not instance
@router.post("/login")
async def login(
    request: LoginRequestDTO,
    db: AsyncSession = Depends(get_db)
):
    service = AuthService(db)  # ✅ FastAPI calls constructor
    return await service.login(request)

# WRONG - Don't instantiate
service = AuthService()  # ❌ Don't do this
```

### Error Handling
```python
# Services RAISE exceptions - never return None/Optional
class AuthService:
    async def login(self, request: LoginRequestDTO) -> TokenResponseDTO:
        user = await self.find_user(request.username)
        if not user:
            raise HTTPException(  # ✅ Raise, don't return None
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        return result

# Routes are CLEAN - no try/except needed
@router.post("/login")
async def login(request: LoginRequestDTO, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.login(request)  # ✅ FastAPI catches exceptions
```

### Type Hints
```python
# ALWAYS use type hints
async def verify_token(self, token: str) -> UserResponseDTO:  # ✅
async def verify_token(self, token):  # ❌ No type hints
```

## Running Locally

1. **Setup virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Start PostgreSQL:**
   ```bash
   docker run -d --name postgres-dev \
     -e POSTGRES_USER=simandaya \
     -e POSTGRES_PASSWORD=simandaya_dev \
     -e POSTGRES_DB=simandaya_db \
     -p 5432:5432 \
     postgres:16-alpine
   ```

3. **Configure environment:**
   ```bash
   cp ../.env.example .env
   # Edit .env with your settings
   ```

4. **Run development server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Access API:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc
   - Health: http://localhost:8000/health

## Testing APIs

### Using Swagger UI
1. Go to http://localhost:8000/docs
2. Try signup endpoint
3. Try login endpoint to get JWT
4. Click "Authorize" and enter: `Bearer YOUR_JWT_TOKEN`
5. Try protected endpoints

### Using cURL

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

**Verify (replace TOKEN):**
```bash
curl -X GET http://localhost:8000/api/v1/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database

### Current Setup
- Using `create_all()` on startup
- Tables auto-created from models
- Good for development

### Production Setup (Alembic)
```bash
# Install Alembic
pip install alembic

# Initialize
alembic init migrations

# Generate migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

## Security

### Password Hashing
- Uses bcrypt with 12 rounds (configurable)
- NEVER stores plain passwords
- Password validation:
  - Min 8 characters
  - 1 uppercase letter
  - 1 lowercase letter
  - 1 digit

### JWT Tokens
- HS256 algorithm
- 30-minute expiration (configurable)
- Contains user_id and username
- Change `JWT_SECRET_KEY` in production!

### Username Validation
- 3-100 characters
- Lowercase only
- Alphanumeric + underscore
- Auto-normalized to lowercase

## Dependencies

Core packages:
- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `sqlalchemy` - ORM
- `asyncpg` - Async PostgreSQL driver
- `pydantic-settings` - Configuration
- `pyjwt` - JWT tokens
- `passlib[bcrypt]` - Password hashing

See `requirements.txt` for full list.

## Future Enhancements

- [ ] Redis token blacklist for logout
- [ ] Alembic migrations
- [ ] Rate limiting (slowapi)
- [ ] Email verification
- [ ] Password reset flow
- [ ] OAuth providers (Google, GitHub)
- [ ] Unit tests (pytest)
- [ ] API versioning
