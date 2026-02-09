# I-Student Architecture Documentation

## System Overview

I-Student is a full-stack web application designed to provide students with a comprehensive AI-powered learning workspace. The system integrates multiple services into a unified platform for studying, collaboration, and content management.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Student    │  │    Admin     │  │   Authentication     │  │
│  │   Portal     │  │   Portal     │  │   (Login/Register)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Node.js/Express)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Routes Layer                       │   │
│  │  /auth  /files  /tutoring  /study  /scheduling  /partners│   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Middleware Layer                         │   │
│  │  - Authentication (JWT)                                   │   │
│  │  - Authorization (RBAC)                                   │   │
│  │  - File Upload (Multer)                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Services Layer                          │   │
│  │  - Transcription Service (Whisper API)                    │   │
│  │  - Tutoring Service (GPT-4 + RAG)                         │   │
│  │  - Study Service (Content Generation)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   MongoDB    │  │  File System │  │   OpenAI API         │  │
│  │   Database   │  │  (Uploads)   │  │  (GPT-4 + Whisper)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 18**: Modern UI library with hooks
- **React Router 6**: Client-side routing
- **Axios**: HTTP client with interceptors
- **Context API**: State management for authentication

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **MongoDB**: NoSQL database via Mongoose ODM
- **JWT**: Token-based authentication
- **Bcrypt**: Password hashing

### AI Services
- **OpenAI GPT-4**: Natural language understanding and content generation
- **OpenAI Whisper**: Speech-to-text transcription
- **RAG (Retrieval-Augmented Generation)**: Context-aware tutoring

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration

## Data Models

### User Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  name: String,
  role: Enum ['student', 'admin'],
  avatar: String,
  bio: String,
  major: String,
  year: String,
  interests: [String],
  availability: [{day, startTime, endTime}],
  studyPartners: [ObjectId],
  groups: [ObjectId],
  createdAt: Date
}
```

### File Model
```javascript
{
  userId: ObjectId,
  filename: String,
  originalName: String,
  fileType: String,
  fileSize: Number,
  storageUrl: String,
  localPath: String,
  transcription: {
    text: String,
    status: Enum ['pending', 'completed', 'failed']
  },
  tags: [String],
  folder: String,
  isPublic: Boolean,
  uploadedAt: Date
}
```

### Group Model
```javascript
{
  name: String,
  description: String,
  course: String,
  members: [ObjectId],
  admin: ObjectId,
  meetingSchedule: [{day, startTime, endTime, location}],
  resources: [ObjectId],
  isActive: Boolean,
  createdAt: Date
}
```

### StudyContent Model
```javascript
{
  userId: ObjectId,
  type: Enum ['quiz', 'flashcard', 'guide'],
  title: String,
  content: Mixed,
  sourceFiles: [ObjectId],
  tags: [String],
  isPublic: Boolean,
  createdAt: Date
}
```

## API Endpoints

### Authentication & Authorization
- **POST /api/auth/register**: User registration
- **POST /api/auth/login**: User login (returns JWT)
- **GET /api/auth/me**: Get current user profile
- **PUT /api/auth/profile**: Update user profile

### File Management
- **POST /api/files/upload**: Upload file (multipart/form-data)
- **GET /api/files**: List user's files
- **GET /api/files/:id**: Get file details
- **PUT /api/files/:id**: Update file metadata
- **DELETE /api/files/:id**: Delete file

### Transcription
- **POST /api/transcription/:fileId**: Start transcription
- **GET /api/transcription/:fileId/status**: Check transcription status

### AI Tutoring
- **POST /api/tutoring/ask**: Ask question with optional file context
- **GET /api/tutoring/history**: Get conversation history

### Study Content Generation
- **POST /api/study/generate**: Generate quiz/flashcards/guide
- **GET /api/study**: List user's study content
- **GET /api/study/:id**: Get specific content
- **DELETE /api/study/:id**: Delete content

### Scheduling
- **POST /api/scheduling/sessions**: Schedule study session
- **GET /api/scheduling/sessions**: Get upcoming sessions
- **PUT /api/scheduling/availability**: Update availability

### Study Partners & Groups
- **GET /api/partners/find**: Find potential study partners
- **POST /api/partners/request**: Add study partner
- **GET /api/partners**: Get user's partners
- **POST /api/partners/groups**: Create study group
- **GET /api/partners/groups**: Get user's groups

### Admin
- **GET /api/admin/users**: List all users
- **GET /api/admin/stats**: Platform statistics
- **DELETE /api/admin/users/:id**: Delete user
- **PUT /api/admin/users/:id/role**: Update user role

## Security Measures

### Authentication
- JWT-based token authentication
- Tokens expire after 7 days
- Bcrypt password hashing with salt rounds

### Authorization
- Role-Based Access Control (RBAC)
- Protected routes with middleware
- Admin-only endpoints

### Input Validation
- File type validation
- File size limits (100MB)
- Request body validation

### CORS
- Configured for frontend URL only
- Credentials enabled

### Environment Variables
- Sensitive data in .env file
- Not committed to version control

## Workflow Examples

### Student Study Session
1. Student logs in → JWT token issued
2. Uploads lecture recording → Saved to file system
3. Requests transcription → OpenAI Whisper API called
4. Transcription completed → Saved to database
5. Student asks question → RAG system retrieves context from transcription
6. GPT-4 generates answer → Displayed to student
7. Student generates quiz → GPT-4 creates questions from content

### Study Partner Matching
1. Student updates profile with interests
2. Finds partners → System matches by interests
3. Adds partner → Relationship stored
4. Creates study group → Group created in database
5. Schedules meeting → Session scheduled

### Admin Monitoring
1. Admin logs in → JWT with admin role
2. Views dashboard → Statistics loaded from DB
3. Manages users → CRUD operations on users

## Scalability Considerations

### Current Architecture
- Monolithic backend
- File storage on local filesystem
- Single MongoDB instance

### Future Improvements
- **Microservices**: Separate services for AI, files, etc.
- **Cloud Storage**: AWS S3/Azure Blob for files
- **Vector Database**: Pinecone/Weaviate for improved RAG
- **Redis**: Caching and session storage
- **Load Balancer**: Nginx/HAProxy for traffic distribution
- **CDN**: CloudFlare for static assets
- **Message Queue**: RabbitMQ/Kafka for async processing

## Deployment

### Docker Compose (Current)
```yaml
services:
  - mongodb: Database
  - backend: Node.js API server
```

### Production Recommendations
- Use managed MongoDB (MongoDB Atlas)
- Enable HTTPS with SSL certificates
- Set up monitoring (Prometheus/Grafana)
- Configure logging (ELK stack)
- Implement backup strategy
- Use container orchestration (Kubernetes)

## Performance Optimization

### Backend
- Database indexing on frequently queried fields
- Connection pooling for MongoDB
- Async/await for non-blocking operations
- Response caching where appropriate

### Frontend
- Code splitting with React.lazy
- Lazy loading of components
- Memoization of expensive computations
- Optimistic UI updates

### AI Services
- Rate limiting for API calls
- Request queuing for transcription
- Caching of similar questions/answers
- Background processing for content generation

## Error Handling

### Backend
- Try-catch blocks in all async functions
- Global error handler middleware
- Structured error responses
- Error logging

### Frontend
- Error boundaries for React components
- API error interceptors
- User-friendly error messages
- Loading states

## Testing Strategy

### Unit Tests
- Model validation
- Service functions
- Utility functions

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests
- User registration and login
- File upload and management
- AI tutoring workflow
- Study content generation

## Monitoring & Logging

### Application Logs
- Request/response logging
- Error tracking
- User actions

### Metrics
- API response times
- Database query performance
- File upload success rate
- AI API usage and costs

### Alerts
- Server downtime
- High error rates
- Database connection issues
- Storage capacity

## Future Features

1. **Real-time Collaboration**: WebSocket for live study sessions
2. **Mobile Apps**: React Native for iOS/Android
3. **Advanced Analytics**: Learning insights and progress tracking
4. **Gamification**: Achievements, streaks, leaderboards
5. **Calendar Integration**: Google Calendar, Outlook
6. **Video Conferencing**: Zoom/Teams integration
7. **LMS Integration**: Canvas, Blackboard, Moodle
8. **AI Recommendations**: Personalized study suggestions
9. **Spaced Repetition**: Flashcard scheduling algorithm
10. **Multi-language Support**: i18n internationalization

## Maintenance

### Regular Tasks
- Dependency updates (security patches)
- Database backups
- Log rotation
- Certificate renewal
- Performance monitoring

### Code Quality
- ESLint for JavaScript linting
- Prettier for code formatting
- Code reviews
- Documentation updates

## Conclusion

I-Student provides a comprehensive platform for modern students, leveraging AI to enhance the learning experience while maintaining security, scalability, and usability. The modular architecture allows for easy extension and maintenance as the platform grows.
