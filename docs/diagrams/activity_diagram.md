# Activity Diagram

End-to-end activity flow for the iStudent AI-Powered Student Workspace.

```mermaid
flowchart TD
    A([Student opens iStudent]) --> B[Upload Lecture Recording / Notes]
    B --> C{File type?}
    C -->|Audio / Video| D[Transcribe via Speech-to-Text]
    C -->|PDF / Slides / Text| E[Extract & Index Content]
    D --> E
    E --> F[Store in Course Folder & Vector Index]
    F --> G{What next?}

    G -->|Ask a question| H[AI Tutor - RAG Q&A]
    H --> I[Return grounded answer with citations]

    G -->|Generate study material| J[Study Content Generator]
    J --> K[Flashcards / Quiz / Practice Test / Study Guide]

    G -->|Plan study schedule| L[Scheduling & Calendar]
    L --> M[Generate study plan from deadlines]
    M --> N[Set reminders & notifications]

    G -->|Find study partner| O[P2P Matching]
    O --> P[Match by course, goals, availability]
    P --> Q[Schedule group session]

    G -->|Discuss topic| R[Forum / Community]
    R --> S[Post question or summary]

    I --> G
    K --> G
    N --> G
    Q --> G
    S --> G
```

## Description

The activity diagram describes end-to-end flows including:

1. **Upload & Capture** – Student uploads a lecture recording or notes.
2. **Transcription** – Audio/video files are transcribed via speech-to-text.
3. **Indexing** – Content is extracted, indexed, and stored in the course folder and vector index.
4. **AI Tutoring** – Student asks questions and receives grounded answers with citations.
5. **Study Content Generation** – Flashcards, quizzes, practice tests, and study guides are generated from materials.
6. **Scheduling** – Study plans are created from deadlines with reminders and notifications.
7. **P2P Matching** – Students find study partners matched by course, goals, and availability.
8. **Forum / Community** – Students discuss topics and share AI-generated summaries.

> **Note:** This diagram will be refined further in the next sprint with additional decision points and data update flows.
