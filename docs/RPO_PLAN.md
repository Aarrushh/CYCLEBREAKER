# Feasibility Analysis and Workflow Design for CYCLEBREAKER Hybrid AI App

## 1. Feasibility Analysis

### Concept Overview
The proposed "Hybrid AI" model combines a lightweight local LLM (e.g., TinyLlama 1.1B) for conversational interface and intent classification with a robust server-side automation backend (n8n + powerful models) for heavy lifting.

### Feasibility for Low-Resource Mobile Deployment
*   **Local Model (TinyLlama 1.1B Quantized):**
    *   **Storage:** A 4-bit quantized 1.1B model requires ~600-800MB of storage. This is significant but feasible for mid-range Android devices (4GB+ RAM, 64GB+ storage). Entry-level devices (2GB RAM) will struggle or fail to load this.
    *   **Compute/Battery:** Running even a small LLM locally is battery-intensive. Continuous conversational use will drain battery quickly.
    *   **Inference Speed:** On mid-range CPUs/NPUs, token generation might be slow (5-15 t/s), which is acceptable for chat but not "instant".
    *   **Verdict:** **Feasible for mid-range devices, risky for entry-level.** Requires strict optimization (e.g., MLC LLM, executorch).

*   **Bandwidth Optimization:**
    *   Sending structured JSON codes (intent/type) instead of full text is highly effective for low-bandwidth environments (2G/3G).
    *   **Verdict:** **Highly Feasible and Excellent Design Choice.**

*   **Offline Capability:**
    *   Local AI can handle basic "chitchat" and cached data queries offline.
    *   **Verdict:** **Feasible.**

## 2. Technical Blockers & Risks

| Risk Area | Risk Description | Mitigation Strategy |
| :--- | :--- | :--- |
| **Device Compatibility** | 1.1B models may crash on <4GB RAM devices common in the target demographic. | Fallback to rule-based chat or smaller non-LLM NLP (e.g., TFLite intent classifier) for lowest-end devices. |
| **Battery Drain** | Local inference generates heat and drains battery. | Limit local AI to "intent detection" only; offload longer generation to server when online? (Trade-off with data cost). |
| **Model Hallucination** | TinyLlama may hallucinate advice or categorize incorrectly. | Strict system prompts; use local AI *only* for classification/formatting, not for generating advice content. |
| **Connectivity** | Users may have intermittent internet. | Aggressive caching of server responses; queue server requests when offline. |
| **Server Costs** | Scaling n8n + API costs for powerful models per user. | Enforce strict daily rate limits (as planned); use open-source models (Mistral/Llama 3) on server via cheaper providers (Groq/Together) or self-hosted. |

## 3. JSON Schema for Client-Server Communication

To minimize token usage and ensure reliability, the client and server will exchange data using strict JSON schemas.

### Client Request (App -> Server)
Sent when the local AI determines a server lookup is needed.

```json
{
  "$schema": "http://cyclebreaker.app/schemas/request.json",
  "user_id": "uuid-v4-string",
  "timestamp": "ISO-8601",
  "request_type": "JOB_SEARCH | ONBOARDING_DATA | ADVICE_QUERY | UPDATE_PROFILE",
  "payload": {
    "intent_code": "FIND_DRIVER_JOBS",
    "parameters": {
      "location": "Cape Town",
      "radius_km": 10,
      "keywords": ["driver", "code 10"]
    },
    "user_context_summary": "User has Code 10 license, looking for immediate work."
  }
}
```

### Server Response (Server -> App)
Returned by n8n workflow.

```json
{
  "status": "success",
  "data_type": "JOB_LISTING | ADVICE_TEXT | ERROR",
  "content": {
    "items": [
      {
        "id": "job-123",
        "title": "Delivery Driver",
        "summary": "R5000/pm, requires Code 10.",
        "action_url": "https://sayouth.mobi/..."
      }
    ],
    "conversational_snippet": "I found 3 driving jobs near you. The first one pays R5000."
  },
  "usage": {
    "daily_limit_remaining": 4
  }
}
```

## 4. n8n Workflow Design

The server will use n8n for orchestration.

### Core Workflow Nodes
1.  **Webhook Trigger (POST):** Receives the JSON payload from the app.
2.  **Schema Validation Node:** Validates incoming JSON against the schema. Rejects malformed requests immediately.
3.  **Rate Limiter (Redis/Postgres):** Checks `user_id` against daily limits. Returns 429 if exceeded.
4.  **Switch/Router Node:** Routes based on `request_type`:
    *   **Route A (ONBOARDING):**
        *   **AI Agent (Profile Builder):** Analyzes raw onboarding answers -> Extracts structured profile -> Saves to Database (Supabase/Postgres).
        *   **Output:** "Profile created successfully."
    *   **Route B (JOB_SEARCH):**
        *   **Database Lookup:** Queries cached jobs matching criteria.
        *   **AI Agent (Matcher):** If no cache, searches external APIs (e.g., Google Jobs, LinkedIn via SerpApi) or scrapes specific portals. Filters for "entry-level".
        *   **Output:** List of top 3 matches.
    *   **Route C (ADVICE_QUERY):**
        *   **RAG Agent:** Queries vector database (knowledge base of financial literacy, rights, etc.).
        *   **LLM Node (Llama 3 70B):** Synthesizes answer based on retrieved context.
        *   **Output:** Concise advice text.
5.  **Response Formatter:** Formats the output into the strict JSON response schema.
6.  **Webhook Response:** Sends the JSON back to the client.

## 5. RPO Workflow Diagram

```mermaid
graph TD
    User((User)) -->|Interacts| LocalAI[Local AI (TinyLlama)]
    
    subgraph Client Device
    LocalAI -->|Classifies Intent| Intent{Need Server?}
    Intent -- No --> LocalResp[Local Response / Cache]
    Intent -- Yes --> ConstructJSON[Construct JSON Request]
    end
    
    ConstructJSON -->|POST JSON| ServerWebhook[n8n Webhook]
    
    subgraph Server Cloud
    ServerWebhook --> RateLimit{Rate Limit OK?}
    RateLimit -- No --> Error429[Return 429 Error]
    RateLimit -- Yes --> Router{Request Type}
    
    Router -- ONBOARDING --> AgentProfile[Profile Agent]
    Router -- JOB_SEARCH --> AgentJobs[Job Match Agent]
    Router -- ADVICE --> AgentAdvice[Advice/RAG Agent]
    
    AgentProfile --> DB[(Database)]
    AgentJobs --> ExtAPI[External APIs]
    AgentAdvice --> VectorDB[(Vector DB)]
    
    AgentProfile & AgentJobs & AgentAdvice --> Formatter[JSON Formatter]
    end
    
    Formatter -->|Return JSON| LocalAI
    LocalAI -->|Render| UI[App UI]
```
