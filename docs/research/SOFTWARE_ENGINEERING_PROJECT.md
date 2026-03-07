# Software Engineering Project

## iStudent: AI-Powered Student Workspace

| Field | Details |
|-------|---------|
| **Group Name** | The Nerds |
| **Group Number** | 10 |
| **Semester** | Spring 2026 |
| **Team Members** | Khoa Nguyen; Alvin Momoh; Tiya Tulu; Sineshaw Tesfaye; Preston Paris |
| **Coordinator** | Alvin Momoh |
| **Guide / Instructor** | Dr. Tushara Sadasivuni |
| **Date** | January 30, 2026 |

---

## Table of Contents

- [1.0 Introduction](#10-introduction)
  - [1.1 Software Engineers' Information](#11-software-engineers-information)
  - [1.2 Planning and Scheduling](#12-planning-and-scheduling)
  - [1.3 Teamwork Basics](#13-teamwork-basics)
  - [1.4 Problem Statement](#14-problem-statement)
  - [1.5 System Requirements](#15-system-requirements)
    - [1.5.1 Context Diagram](#151-context-diagram)
    - [1.5.2 Activity Diagram](#152-activity-diagram)
- [References](#references)

---

## 1.0 Introduction

### 1.1 Software Engineers' Information

Brief resumes and skill sets of all team members (to be completed).

**Khoa Nguyen**
- Role on project:
- Relevant skills:
- Brief background:

**Alvin Momoh**
- Role on project:
- Relevant skills:
- Brief background:

**Tiya Tulu**
- Role on project:
- Relevant skills:
- Brief background:

**Sineshaw Tesfaye**
- Role on project:
- Relevant skills:
- Brief background:

**Preston Paris**
- Role on project:
- Relevant skills:
- Brief background:

### 1.2 Planning and Scheduling

High-level task assignment and schedule (to be refined as the sprint progresses).

| Assignee | Email | Task | Duration (hours) | Dependency | Due Date |
|----------|-------|------|-------------------|------------|----------|
| Khoa Nguyen | knguyen221@student.gsu.edu | TBD | TBD | TBD | 01/30/2026 |
| Alvin Momoh | amomoh2@student.gsu.edu | TBD | TBD | TBD | TBD |
| Tiya Tulu | ttulu1@student.gsu.edu | TBD | TBD | TBD | TBD |
| Sineshaw Tesfaye | stesfaye4@student.gsu.edu | TBD | TBD | TBD | TBD |
| Preston Paris | pparis3@student.gsu.edu | TBD | TBD | TBD | TBD |

### 1.3 Teamwork Basics

Two things get accomplished in good teams: the task gets accomplished and the satisfaction of team members is high. To achieve this, the team will establish ground rules for communication, task ownership, deadlines, and conflict resolution as described in the Teamwork Basics guidance provided in iCollege.

### 1.4 Problem Statement

**What is your product, on a high level?**

An AI-powered student workspace that organizes academic life end-to-end—from managing files and schedules to learning faster with tutoring, transcription, study guides, and quizzes—while also helping users find the right people to study with.

**Whom is it for?**

Primarily high school and college students who want flexible, personalized academic support and better study organization.

**What problem does it solve?**

Students juggle materials across many tools (Drive folders, PDFs, email attachments, recordings), struggle to turn notes into effective practice, miss deadlines, and often lack accountability or the right study partners—leading to inefficient studying and burnout.

**What alternatives are available?**

Chegg, school tutoring, Quizlet, Course Hero, Brainly, and general productivity tools (Google Drive/Docs/Calendar, Notion, OneNote).

**Why is this project compelling and worth developing?**

It addresses a real and growing challenge: students need personalized support that fits their schedule and learning style. By combining organization, tutoring, practice generation, scheduling, and collaboration in one platform, it reduces friction and improves learning outcomes with a scalable architecture.

#### Top-level objectives, differentiators, target customers, and scope

**Objectives:**

- Unify the student workflow in one place (files, transcripts, tutoring, scheduling, study creation, collaboration).
- Convert passive materials into active learning automatically (study guides, flashcards, quizzes, practice tests).
- Make studying plan-driven, not panic-driven (deadlines → actionable schedule and study blocks).
- Personalize help at scale with grounded tutoring on the student's own materials.
- Increase accountability through study partner/group matching and community features.

**Key differentiators:**

- Closed-loop workflow: Capture → Organize → Understand → Practice → Schedule → Group Study.
- Grounded tutoring based on a student's own uploads and transcripts (not generic answers).
- Automatic conversion from content to assessments (Quizlet-style sets) plus spaced repetition review.
- First-class P2P study matching tied to scheduling and goals.
- Study-native research mode that outputs structured notes, outlines, and learning artifacts.

**Target customers:**

- High school and college students seeking organized, flexible academic support.
- Peer tutors and study groups who need a structured way to share materials and practice sets.

**Product scope (in-scope features):**

- Core workspace: course folders; upload/manage PDFs, slides, notes, links, recordings; tagging and search.
- Transcription & note capture: audio/video → transcript; timestamps; summaries and key points.
- AI tutoring & research: grounded Q&A; explanations; examples; structured research outputs.
- Study content generation: flashcards, quizzes, practice tests, study guides; export/share sets.
- Scheduling & calendar: tasks, deadlines, reminders, study plan generator, notifications.
- P2P matching & groups: partner/group matching; basic chat/coordination; session scheduling.
- Forum/community: course/topic forums; AI summarization; reporting/moderation basics.

**Out of scope for the initial MVP:**

- Replacing an LMS end-to-end (grading, submissions, attendance).
- Proctoring or invasive monitoring.
- Building a full video-conferencing platform (use integrations).
- Institution-wide analytics without a privacy and compliance plan.

#### Competitors and novelty

**Competitors:**

- Study content: Quizlet, Anki, Brainscape, Kahoot, Quizizz.
- AI tutoring: Chegg, Khan Academy (Khanmigo), Brainly, Course Hero, Photomath.
- Workspace + AI: Notion, Google Workspace (Gemini), Microsoft OneNote/Copilot, Obsidian, Evernote.
- Transcription: Otter.ai, Notta, Fireflies, Zoom AI tools.
- Community: Discord/Reddit, Piazza/Ed discussion boards.

**What's novel in our approach:**

- A unified student OS that connects organization, tutoring, practice generation, scheduling, and collaboration in one loop.
- Grounded tutoring plus automatic practice creation in the same workspace (transcript → study guide → quizzes → schedule).
- P2P matching as a core product feature with availability-aware scheduling and accountability.
- Study-native research workflows that produce structured outputs ready for studying.

#### Feasibility

This system is practical to build today using proven, widely available technology. Files are stored in cloud object storage and indexed with metadata; semantic search uses embeddings and a vector index; transcription relies on mature speech-to-text APIs; and tutoring/generation uses large language models with retrieval-augmented generation (RAG) to ground answers in a student's own materials. Scheduling uses standard calendar models (events, tasks, reminders), and P2P matching can be implemented with profile attributes (course, goals, availability) and a ranking algorithm.

#### Technical interest

- Building reliable RAG over messy student data (hybrid search, reranking, citations/traceability, cost controls).
- Multimodal pipeline: audio → transcript → knowledge extraction → validated quizzes/flashcards/study guides.
- Scheduling and study planning as an optimization problem (deadlines, difficulty, adaptivity).
- Privacy-aware personalization (opt-in memory, transparent controls).
- P2P matching as recommender systems plus trust & safety (reputation, abuse prevention, group formation).
- Production reliability for AI (guardrails, evaluation harnesses, latency/cost monitoring, fallbacks).

#### Client login and admin login

Yes. The web app supports role-based access with separate Student (Client) and Admin portals.

#### Documents used as sources

- OWASP Application Security Verification Standard (ASVS).
- OAuth 2.0 and OpenID Connect (OIDC).
- NIST Digital Identity Guidelines (SP 800-63).
- Role-based access control (RBAC) patterns commonly implemented with PostgreSQL-backed applications.

### 1.5 System Requirements

#### 1.5.1 Context Diagram

At a high level, the AI Study Workspace is the central system. Students, peers, and admins access the platform through the web UI. Core services include file management, transcription, grounded AI tutoring (RAG), study content generation, scheduling, P2P matching, and forums. External services include the database, object storage, vector index, LLM provider, speech-to-text provider, and notifications.

```
[Student]          [Study Partner]          [Admin]
    |                    |                    |
    |  Web / Mobile UI   |  Web / Mobile UI   |  Admin Console
    +----------+---------+---------+----------+
               |
        [Backend API + Auth/RBAC]
               |
  +------------+------------------------------+
  |   Core Modules (inside the system)        |
  |  - Files & Search                         |
  |  - Transcription                          |
  |  - AI Tutor / Research (RAG)              |
  |  - Study Guide / Quiz Generator           |
  |  - Scheduling & Calendar                  |
  |  - P2P Matching & Groups                  |
  |  - Forum / Community                      |
  +------------+------------------------------+
               |
   +-----------+-----------+-----------+-----------+
   |                       |                       |
[Database]           [Object Storage]        [Vector Index]
   |                       |                       |
   +-----------+-----------+-----------+-----------+
               |
        [LLM Provider]   [Speech-to-Text]   [Notifications]
```

See also: [Context Diagram (Mermaid)](../diagrams/context_diagram.md)

#### 1.5.2 Activity Diagram

The activity diagram describes end-to-end flows (e.g., Upload lecture → Transcribe → Index → Ask Tutor → Generate quiz → Schedule study session) including decision points, data updates, and user interactions. (To be completed in the next sprint.)

See also: [Activity Diagram (Mermaid)](../diagrams/activity_diagram.md)

---

## References

- Mermaid Live Editor. (n.d.). *Mermaid Live Editor*. https://mermaid.live
- Visual Paradigm Online. (n.d.). *System Context Diagram Tool*. https://online.visual-paradigm.com
