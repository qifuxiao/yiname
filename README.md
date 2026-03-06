# YiName Backend
FastAPI backend for AI-powered naming application with Zhouyi周易 analysis.

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `SECRET_KEY` | FastAPI secret key for JWT |
| `MOLIGAN_URL` | AI API endpoint |
| `MOLIGAN_API_KEY` | AI API key |

## API Endpoints

- `POST /api/v1/names/generate` - Generate names
- `POST /api/v1/names/analyze` - Analyze name
- `GET /api/v1/users/me` - Get current user
- `POST /api/v1/users/register` - Register user
- `POST /api/v1/users/login` - Login user
