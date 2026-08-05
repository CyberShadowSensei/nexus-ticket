# AI Support Ticket Classification & Resolution System

## Overview & Architecture

The **NexusAI Ticket Studio** is an autonomous support ticket classification, clustering, and RAG resolution system. It processes incoming unstructured support requests, aggregates them into semantic clusters, and produces step-by-step resolution drafts.

```mermaid
graph TD
    A[Incoming Tickets Batch] --> B[Model Provider Dispatcher]
    B -->|Local Inference| C[Ollama Engine: gemma:2b / llama3.2]
    B -->|Cloud API| D[Groq API / OpenRouter API]
    B -->|Offline Fallback| E[Keyword Vector Similarity Engine]
    
    C --> F[Zero-Shot Intent Classifier & Clusterer]
    D --> F
    E --> F
    
    F --> G[Group 1: Authentication & Password Issues]
    F --> H[Group 2: HR & Leave Management]
    
    G --> I[Knowledge Base Context RAG Engine]
    H --> I
    
    I --> J[Step-by-Step AI Resolution Matrix Output]
```

---

## Processing Flowchart & System Interaction

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Web Dashboard
    participant Backend as Flask API Server (Port 5000)
    participant LLM as Ollama / Groq / OpenRouter
    participant KB as RAG Knowledge Base

    User->>UI: Input Support Tickets
    User->>UI: Click "EXECUTE CLUSTERING"
    UI->>Backend: POST /api/cluster { tickets, provider }
    alt Backend Connected
        Backend->>LLM: Send Clustering Prompt + Ticket Payload
        LLM-->>Backend: Return JSON Clusters
    else Offline Fallback
        Backend->>Backend: Run Vector Keyword Similarity Engine
    end
    Backend-->>UI: Return Cluster Matrix
    UI-->>User: Render Cluster Matrix Cards

    User->>UI: Click "GENERATE RESOLUTIONS"
    UI->>Backend: POST /api/solve { clusters, provider }
    Backend->>KB: Fetch Knowledge Base Contexts (Password / HR)
    Backend->>LLM: RAG Prompting (KB + Ticket Text)
    LLM-->>Backend: Generated Step-by-Step Resolution Drafts
    Backend-->>UI: Return Clusters + Solutions
    UI-->>User: Render Resolution Drafts & Copy Controls
```

---

## Features & Supported AI Backends

1. **Ollama (Local LLM)**: Zero-cost, offline local inference utilizing models like `gemma:2b` or `llama3.2`.
2. **Groq API**: High-speed cloud LLM execution (`llama-3.3-70b-versatile`).
3. **OpenRouter API**: Access to open-weights models (`meta-llama/llama-3-8b-instruct:free`).
4. **Deterministic Fallback Engine**: Guarantees zero downtime by utilizing keyword vector matching if remote or local LLM instances are unreachable.
5. **Editorial Monolithic UI**: High-contrast, non-generic dark charcoal (`#1A1A1A`) on off-white canvas (`#F4F4F2`) design adhering strictly to `Rules.md`.

---

## File Structure

- `app.py`: Flask HTTP REST API.
- `ai_engine.py`: Clustering algorithms, LLM prompt engineering, and RAG knowledge base.
- `index.html`: Editorial Monolithic layout.
- `style.css`: Monolithic grid tokens and typography.
- `app.js`: Interactive state management and API integration.
- `SKILL.md`: Design system specification for agent reuse.
