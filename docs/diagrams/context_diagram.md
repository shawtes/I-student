# Context Diagram

System context diagram for the iStudent AI-Powered Student Workspace.

```mermaid
graph TB
    Student([Student])
    Partner([Study Partner])
    Admin([Admin])

    Student -->|Web / Mobile UI| Backend
    Partner -->|Web / Mobile UI| Backend
    Admin -->|Admin Console| Backend

    subgraph System ["iStudent Platform"]
        Backend[Backend API + Auth/RBAC]
        Backend --> Files[Files & Search]
        Backend --> Transcription[Transcription]
        Backend --> Tutor[AI Tutor / Research - RAG]
        Backend --> StudyGen[Study Guide / Quiz Generator]
        Backend --> Schedule[Scheduling & Calendar]
        Backend --> P2P[P2P Matching & Groups]
        Backend --> Forum[Forum / Community]
    end

    Files --> DB[(Database)]
    Files --> ObjStore[(Object Storage)]
    Tutor --> VectorIdx[(Vector Index)]
    Tutor --> LLM[LLM Provider]
    Transcription --> STT[Speech-to-Text Provider]
    Schedule --> Notify[Notification Service]
```

## Description

At a high level, the AI Study Workspace is the central system. Students, peers, and admins access the platform through the web UI. Core services include file management, transcription, grounded AI tutoring (RAG), study content generation, scheduling, P2P matching, and forums. External services include the database, object storage, vector index, LLM provider, speech-to-text provider, and notifications.
