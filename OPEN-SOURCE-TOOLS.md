# Open Source Tools & Licensing

This document catalogs open source tools and libraries that the I-Student project can use, organized by category with licensing details.

---

## Table of Contents

1. [Learning Management Systems (LMS)](#learning-management-systems-lms)
2. [Intelligent Tutoring & Adaptive Learning](#intelligent-tutoring--adaptive-learning)
3. [Spaced Repetition & Memory Systems](#spaced-repetition--memory-systems)
4. [AI-Powered Education Tools](#ai-powered-education-tools)
5. [Core Backend Libraries](#core-backend-libraries)
6. [Core Frontend Libraries](#core-frontend-libraries)
7. [DevOps & Infrastructure](#devops--infrastructure)
8. [License Compatibility Matrix](#license-compatibility-matrix)
9. [Recommended License Strategy](#recommended-license-strategy)

---

## Learning Management Systems (LMS)

| Project | URL | Language | License | Description |
|---------|-----|----------|---------|-------------|
| **Moodle** | [moodle/moodle](https://github.com/moodle/moodle) | PHP | **GPL-3.0** | World's most widely used open-source LMS with an extensive plugin ecosystem for course management, grading, and collaboration. |
| **Canvas LMS** | [instructure/canvas-lms](https://github.com/instructure/canvas-lms) | Ruby | **AGPL-3.0** | Modern LMS widely used in higher education with a REST API for integrations. |
| **Frappe LMS** | [frappe/lms](https://github.com/frappe/lms) | Vue/Python | **AGPL-3.0** | Simple, beautiful LMS built on the Frappe framework. Easy to customize and extend. |
| **ClassroomIO** | [classroomio/classroomio](https://github.com/classroomio/classroomio) | Svelte | **AGPL-3.0** | Open-source education platform built with SvelteKit and Supabase. Alternative to Moodle/Teachable. |

---

## Intelligent Tutoring & Adaptive Learning

| Project | URL | Language | License | Description |
|---------|-----|----------|---------|-------------|
| **Student Modeling Project** | [yrahul3910/student-modeling-project](https://github.com/yrahul3910/student-modeling-project) | Jupyter Notebook | **MIT** | ITS implementation using various algorithms for student modeling and knowledge tracing. |
| **OpenTutor** | Community projects | Python | **MIT** | Various open-source intelligent tutoring system frameworks available under permissive licenses. |

---

## Spaced Repetition & Memory Systems

| Project | URL | Language | License | Description |
|---------|-----|----------|---------|-------------|
| **Anki** | [ankitects/anki](https://github.com/ankitects/anki) | Rust | **AGPL-3.0** | The most popular smart spaced-repetition flashcard program. Highly extensible with add-ons. |
| **FSRS** | [open-spaced-repetition/free-spaced-repetition-scheduler](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler) | Various | **MIT** | State-of-the-art spaced-repetition algorithm based on the DSR model. Can be integrated into any app. |
| **FSRS4Anki** | [open-spaced-repetition/fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki) | Jupyter Notebook | **MIT** | Modern Anki scheduling using the FSRS algorithm with machine learning. |
| **Carden** | [alyssaxuu/carden](https://github.com/alyssaxuu/carden) | JavaScript | **MIT** | Flashcards with spaced repetition and gamification. Chrome extension for bite-sized learning. |

---

## AI-Powered Education Tools

| Project | URL | Language | License | Description |
|---------|-----|----------|---------|-------------|
| **EduNexus 2.0** | [muhammadibrahim313/EDUNEXUS-2.0](https://github.com/muhammadibrahim313/EDUNEXUS-2.0) | Python | **MIT** | AI learning platform offering personalized learning, real-time support, and coding mentorship. |
| **LangChain** | [langchain-ai/langchain](https://github.com/langchain-ai/langchain) | Python | **MIT** | Framework for building applications with LLMs — useful for RAG-based tutoring pipelines. |
| **LlamaIndex** | [run-llama/llama_index](https://github.com/run-llama/llama_index) | Python | **MIT** | Data framework for LLM applications — ideal for indexing study materials for AI retrieval. |
| **Whisper** | [openai/whisper](https://github.com/openai/whisper) | Python | **MIT** | General-purpose speech recognition model. Useful for transcription of lecture recordings. |
| **Hugging Face Transformers** | [huggingface/transformers](https://github.com/huggingface/transformers) | Python | **Apache-2.0** | State-of-the-art ML models for NLP tasks including question generation and summarization. |

---

## Core Backend Libraries

These are the libraries used in the I-Student backend (Node.js/Express):

| Library | Version | License | Purpose |
|---------|---------|---------|---------|
| **Express** | ^4.18.2 | **MIT** | Web application framework |
| **Mongoose** | ^8.9.5 | **MIT** | MongoDB ODM for data modeling |
| **jsonwebtoken** | ^9.0.2 | **MIT** | JWT-based authentication |
| **bcryptjs** | ^2.4.3 | **MIT** | Password hashing |
| **multer** | ^2.0.2 | **MIT** | Multipart form data / file uploads |
| **axios** | ^1.12.0 | **MIT** | HTTP client |
| **cors** | ^2.8.5 | **MIT** | Cross-Origin Resource Sharing |
| **dotenv** | ^16.3.1 | **BSD-2-Clause** | Environment variable management |
| **express-rate-limit** | ^8.2.1 | **MIT** | API rate limiting |
| **openai** | ^4.20.0 | **Apache-2.0** | OpenAI API client (GPT-4, Whisper) |
| **uuid** | ^9.0.1 | **MIT** | UUID generation |
| **nodemon** | ^3.0.1 | **MIT** | Development auto-restart (dev dependency) |

---

## Core Frontend Libraries

These are the libraries used in the I-Student client (React):

| Library | Version | License | Purpose |
|---------|---------|---------|---------|
| **React** | ^18.2.0 | **MIT** | UI component library |
| **React DOM** | ^18.2.0 | **MIT** | React renderer for the browser |
| **React Router DOM** | ^6.20.0 | **MIT** | Client-side routing |
| **Axios** | ^1.12.0 | **MIT** | HTTP client for API calls |
| **react-scripts** | 5.0.1 | **MIT** | Create React App build tooling |

---

## DevOps & Infrastructure

| Tool | License | Purpose |
|------|---------|---------|
| **Docker** | **Apache-2.0** | Application containerization |
| **Docker Compose** | **Apache-2.0** | Multi-container orchestration |
| **MongoDB** | **SSPL** (Server Side Public License) | NoSQL database. Free to use; SSPL applies to offering MongoDB as a managed service. |
| **Node.js** | **MIT** | JavaScript runtime |
| **Nginx** | **BSD-2-Clause** | Reverse proxy / load balancer (future) |
| **GitHub Actions** | N/A (service) | CI/CD pipeline |

---

## License Compatibility Matrix

| License | Type | Commercial Use | Modification | Distribution | Patent Grant | Copyleft |
|---------|------|:-:|:-:|:-:|:-:|:-:|
| **MIT** | Permissive | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Apache-2.0** | Permissive | ✅ | ✅ | ✅ | ✅ | ❌ |
| **BSD-2-Clause** | Permissive | ✅ | ✅ | ✅ | ❌ | ❌ |
| **GPL-3.0** | Copyleft | ✅ | ✅ | ✅ | ✅ | ✅ (Strong) |
| **AGPL-3.0** | Copyleft | ✅ | ✅ | ✅ | ✅ | ✅ (Strongest) |
| **SSPL** | Source-available | ✅ | ✅ | ✅ | ❌ | ✅ (Network) |

### Key Considerations

- **MIT / Apache-2.0 / BSD** projects can be freely integrated into I-Student regardless of our license choice.
- **GPL-3.0** projects require derivative works to also be GPL-3.0.
- **AGPL-3.0** projects have the strictest copyleft — network use counts as distribution. Direct code reuse requires I-Student to also adopt AGPL-3.0.
- **SSPL** (MongoDB) is free to use as a database; the license only applies if you offer the database itself as a managed service.

---

## Recommended License Strategy

I-Student uses the **MIT License**, which provides:

| Aspect | Detail |
|--------|--------|
| **Adoption** | Maximum adoption and contribution potential |
| **Compliance** | Simple — just include the copyright notice |
| **Integration** | Can freely integrate MIT, Apache-2.0, and BSD-licensed code |
| **Limitation** | Cannot directly reuse GPL/AGPL-licensed source code |

### What This Means in Practice

- ✅ We can use **FSRS**, **LangChain**, **Whisper**, **Carden**, **EduNexus**, and all Node.js/React libraries directly.
- ✅ We can use **MongoDB** and **Docker** as infrastructure without license concerns.
- ⚠️ We can study **Anki**, **Canvas LMS**, **Moodle** for design inspiration but should not copy their source code.
- ⚠️ We should write our own implementations inspired by (but not copied from) AGPL/GPL projects.

---

*Last updated: February 2026*
