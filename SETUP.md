# Developer Setup Guide

This guide will help you set up the I-Student development environment on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher): [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (v5 or higher): [Download](https://www.mongodb.com/try/download/community)
- **Git**: [Download](https://git-scm.com/downloads)
- **Code Editor**: VS Code recommended

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/shawtes/I-student.git
cd I-student
```

### 2. Install Dependencies

Install backend dependencies:
```bash
npm install
```

Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

### 3. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and configure the following:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - Use local MongoDB
MONGODB_URI=mongodb://localhost:27017/i-student

# JWT Secret - Generate a random string
JWT_SECRET=your-random-secret-key-here

# OpenAI API - Get from https://platform.openai.com/
OPENAI_API_KEY=sk-your-openai-api-key

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Important**: 
- Replace `JWT_SECRET` with a strong random string
- Get an OpenAI API key from https://platform.openai.com/ (required for AI features)

### 4. Start MongoDB

**On macOS/Linux:**
```bash
mongod --dbpath=/path/to/data/directory
```

**On Windows:**
```bash
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### 5. Start the Application

**Option 1: Run backend and frontend separately (recommended for development)**

Terminal 1 - Backend server with hot reload:
```bash
npm run dev
```

Terminal 2 - Frontend development server:
```bash
cd client
npm start
```

**Option 2: Run backend only (if you want to test API)**
```bash
npm start
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Development Workflow

### Project Structure

```
I-student/
├── server/              # Backend code
│   ├── config/         # Database configuration
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── middleware/     # Auth, validation
│   ├── services/       # Business logic
│   └── index.js        # Entry point
├── client/             # Frontend React app
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── context/    # React context
│   │   ├── services/   # API client
│   │   └── App.js      # Main app
│   └── public/         # Static files
├── uploads/            # Uploaded files
└── package.json        # Backend dependencies
```

### Making Changes

#### Backend Changes

1. Edit files in `server/` directory
2. Server will automatically restart (if using `npm run dev`)
3. Test changes by calling API endpoints

#### Frontend Changes

1. Edit files in `client/src/` directory
2. Browser will automatically reload
3. Test changes in the browser

### Testing API Endpoints

Use curl, Postman, or any API client:

**Register a new user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "student"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Upload a file (after getting token):**
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/file.pdf"
```

## Common Tasks

### Reset Database

To start with a fresh database:

```bash
# Connect to MongoDB
mongo

# In MongoDB shell
use i-student
db.dropDatabase()
```

### Clear Uploaded Files

```bash
rm -rf uploads/*
echo "# This directory stores uploaded files" > uploads/.gitkeep
```

### Update Dependencies

```bash
# Backend
npm update

# Frontend
cd client
npm update
```

### Run Linting

```bash
# Backend (if configured)
npm run lint

# Frontend
cd client
npm run lint
```

## Troubleshooting

### MongoDB Connection Error

**Error**: `MongoNetworkError: failed to connect to server`

**Solution**:
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- Verify MongoDB is listening on port 27017

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port
PORT=5001 npm start
```

### OpenAI API Key Issues

**Error**: API key not configured or invalid

**Solution**:
- Get API key from https://platform.openai.com/
- Add to `.env` file: `OPENAI_API_KEY=sk-...`
- Restart server

**Note**: Without OpenAI API key, the app will return mock responses for AI features.

### File Upload Fails

**Error**: File upload returns 400 or 500

**Solution**:
- Check file type is allowed (PDF, DOC, audio, video)
- Verify file size is under 100MB
- Ensure `uploads/` directory exists and is writable
- Check disk space

### Frontend Not Loading

**Error**: Blank page or "Cannot GET /"

**Solution**:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

### CORS Errors

**Error**: `Access-Control-Allow-Origin` error

**Solution**:
- Ensure backend is running on port 5000
- Check `FRONTEND_URL` in `.env` matches frontend URL
- Verify CORS configuration in `server/index.js`

## Docker Development

If you prefer using Docker:

### Build and Run

```bash
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f backend
```

### Stop Services

```bash
docker-compose down
```

### Rebuild After Changes

```bash
docker-compose up -d --build
```

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Backend server port | 5000 | No |
| NODE_ENV | Environment (development/production) | development | No |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/i-student | Yes |
| JWT_SECRET | Secret for JWT tokens | - | Yes |
| OPENAI_API_KEY | OpenAI API key | - | For AI features |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 | No |

## Testing

### Manual Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] File upload works
- [ ] File list displays correctly
- [ ] File deletion works
- [ ] AI tutor responds (with API key)
- [ ] Study content generation works
- [ ] Schedule creation works
- [ ] Partner finding works
- [ ] Group creation works
- [ ] Admin dashboard displays stats
- [ ] Admin can manage users

### Test Users

After registering, you can create test users:

**Student User:**
- Email: student@test.com
- Password: password123
- Role: student

**Admin User:**
- Email: admin@test.com
- Password: password123
- Role: admin

## Code Style

### Backend (Node.js)
- Use async/await for asynchronous operations
- Use meaningful variable names
- Add error handling with try-catch
- Comment complex logic
- Use ES6+ features

### Frontend (React)
- Use functional components with hooks
- Keep components small and focused
- Use Context API for global state
- Follow React best practices
- Use meaningful component names

## Git Workflow

### Branching

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature"

# Push to remote
git push origin feature/your-feature-name
```

### Commit Messages

Use clear, descriptive commit messages:
- `feat: Add user profile page`
- `fix: Resolve file upload bug`
- `docs: Update README`
- `refactor: Improve auth middleware`
- `test: Add user model tests`

## Getting Help

If you encounter issues:

1. Check this guide and README.md
2. Review ARCHITECTURE.md for system design
3. Check existing GitHub issues
4. Open a new issue with:
   - Problem description
   - Steps to reproduce
   - Error messages
   - System information

## Next Steps

Once you have the development environment running:

1. Explore the codebase
2. Try all features through the UI
3. Review API endpoints in routes/
4. Understand data models in models/
5. Read ARCHITECTURE.md for system design
6. Start building your feature!

## Resources

- **MongoDB Docs**: https://docs.mongodb.com/
- **Express Docs**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **OpenAI API**: https://platform.openai.com/docs
- **JWT**: https://jwt.io/

Happy coding! 🚀
