# I-Student: AI-Powered Student Workspace

A comprehensive AI-powered student workspace that unifies file management, transcription, grounded tutoring (RAG), study content generation (quizzes/flashcards/guides), scheduling, and study partner matching into one closed-loop workflow.

## Features

### Core Functionality
- **🔐 Authentication & RBAC**: Secure login with role-based access (Student/Admin portals)
- **📁 File Management**: Upload, organize, and manage study materials (PDF, DOC, audio, video)
- **🎙️ Transcription**: Automatic audio/video transcription using OpenAI Whisper
- **🤖 AI Tutoring (RAG)**: Get instant answers grounded in your study materials
- **📚 Study Tools**: Generate quizzes, flashcards, and study guides from your content
- **📅 Scheduling**: Plan study sessions and manage availability
- **👥 Study Partners**: Find partners and form study groups based on interests
- **📊 Admin Dashboard**: Platform statistics and user management

### Technology Stack

**Backend:**
- Node.js + Express
- MongoDB (Database)
- JWT Authentication
- OpenAI API (GPT-4 for tutoring, Whisper for transcription)
- Multer (File uploads)

**Frontend:**
- React 18
- React Router
- Axios
- Modern CSS

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- MongoDB (local or cloud)
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shawtes/I-student.git
cd I-student
```

2. **Install dependencies**
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/i-student

# JWT Secret (change in production)
JWT_SECRET=your-secret-key-change-in-production

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod
```

5. **Run the application**

**Development mode (with hot reload):**
```bash
# Terminal 1: Start backend server
npm run dev

# Terminal 2: Start frontend
npm run client
```

**Production mode:**
```bash
# Build frontend
npm run build

# Start server
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

### For Students

1. **Register/Login**: Create an account or login at `/login`
2. **Upload Files**: Navigate to Files section and upload study materials
3. **AI Tutoring**: Ask questions in the AI Tutor section, optionally select files for context
4. **Generate Study Content**: Create quizzes, flashcards, or study guides from your materials
5. **Schedule Sessions**: Plan your study sessions
6. **Find Partners**: Connect with other students and form study groups

### For Admins

1. **Login**: Use admin credentials
2. **View Dashboard**: See platform statistics
3. **Manage Users**: View and manage user accounts

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files` - Get user's files
- `GET /api/files/:id` - Get file details
- `PUT /api/files/:id` - Update file metadata
- `DELETE /api/files/:id` - Delete file

### Transcription
- `POST /api/transcription/:fileId` - Transcribe audio/video file
- `GET /api/transcription/:fileId/status` - Get transcription status

### Tutoring (RAG)
- `POST /api/tutoring/ask` - Ask a question
- `GET /api/tutoring/history` - Get conversation history

### Study Content
- `POST /api/study/generate` - Generate study content
- `GET /api/study` - Get user's study content
- `GET /api/study/:id` - Get specific content
- `DELETE /api/study/:id` - Delete content

### Scheduling
- `POST /api/scheduling/sessions` - Schedule session
- `GET /api/scheduling/sessions` - Get sessions
- `PUT /api/scheduling/availability` - Update availability

### Partners & Groups
- `GET /api/partners/find` - Find study partners
- `POST /api/partners/request` - Add partner
- `GET /api/partners` - Get user's partners
- `POST /api/partners/groups` - Create study group
- `GET /api/partners/groups` - Get user's groups

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get platform statistics
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id/role` - Update user role

## Project Structure

```
I-student/
├── server/
│   ├── config/
│   │   └── database.js          # MongoDB configuration
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── File.js              # File model
│   │   ├── Group.js             # Group model
│   │   └── StudyContent.js      # Study content model
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── adminAuth.js         # Admin authorization
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── files.js             # File management routes
│   │   ├── transcription.js     # Transcription routes
│   │   ├── tutoring.js          # AI tutoring routes
│   │   ├── study.js             # Study content routes
│   │   ├── scheduling.js        # Scheduling routes
│   │   ├── partners.js          # Partners & groups routes
│   │   └── admin.js             # Admin routes
│   ├── services/
│   │   ├── transcriptionService.js  # Whisper integration
│   │   ├── tutoringService.js       # RAG/GPT integration
│   │   └── studyService.js          # Content generation
│   └── index.js                 # Express server
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── auth/            # Login, Register
│       │   ├── student/         # Student portal components
│       │   └── admin/           # Admin portal components
│       ├── context/
│       │   └── AuthContext.js   # Authentication context
│       ├── services/
│       │   └── api.js           # API client
│       ├── App.js
│       ├── index.js
│       └── index.css
├── uploads/                     # File upload directory
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Configuration

### OpenAI API
To use AI features (tutoring and study content generation), you need an OpenAI API key:
1. Get an API key from https://platform.openai.com/
2. Add it to your `.env` file as `OPENAI_API_KEY`

### MongoDB
You can use:
- **Local MongoDB**: Install and run `mongod`
- **MongoDB Atlas**: Use a cloud database (recommended for production)

Update `MONGODB_URI` in `.env` with your connection string.

## Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Student and Admin roles
- **Protected Routes**: Middleware authorization
- **Input Validation**: Request validation
- **CORS Configuration**: Controlled cross-origin requests

## Deployment

### Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment

1. Build the frontend:
```bash
cd client && npm run build
```

2. Set environment variables for production
3. Start the server:
```bash
NODE_ENV=production npm start
```

## Future Enhancements

- [ ] Vector database integration (Pinecone) for improved RAG
- [ ] Real-time collaboration features
- [ ] Mobile app (React Native)
- [ ] Analytics and learning insights
- [ ] Integration with learning management systems (LMS)
- [ ] Advanced scheduling with calendar integration
- [ ] Gamification and achievement system
- [ ] Study session recording and playback
- [ ] AI-powered study recommendations
- [ ] Multi-language support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built with ❤️ for students everywhere