# I-Student: AI-Powered Student Workspace

A comprehensive AI-powered student workspace that unifies file management, transcription, grounded tutoring (RAG), study content generation (quizzes/flashcards/guides), scheduling, and study partner matching into one closed-loop workflow.

## Features

- **🔐 Authentication & RBAC** — Secure login with role-based access (Student/Admin portals)
- **📁 File Management** — Upload, organize, and manage study materials (PDF, DOC, audio, video)
- **🎙️ Transcription** — Automatic audio/video transcription using OpenAI Whisper
- **🤖 AI Tutoring (RAG)** — Get instant answers grounded in your study materials
- **📚 Study Tools** — Generate quizzes, flashcards, and study guides from your content
- **📅 Scheduling** — Plan study sessions and manage availability
- **👥 Study Partners** — Find partners and form study groups based on interests
- **📊 Admin Dashboard** — Platform statistics and user management

## Documentation

| Document | Description |
|----------|-------------|
| [tech-stack.md](tech-stack.md) | Full technology stack for each component and alternative stacks |
| [OPEN-SOURCE-TOOLS.md](OPEN-SOURCE-TOOLS.md) | Open source tools we can use, with licensing details |
| [LICENSE](LICENSE) | MIT License for this project |

## Quick Start

```bash
# Install dependencies
npm install && cd client && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and OpenAI API key

# Run in development mode
npm run dev      # Backend (Terminal 1)
npm run client   # Frontend (Terminal 2)
```

See [`copilot/add-ai-student-workspace`](https://github.com/shawtes/I-student/tree/copilot/add-ai-student-workspace) branch for the full application implementation.

## License

This project is licensed under the [MIT License](LICENSE).