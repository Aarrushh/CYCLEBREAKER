# Hybrid Architecture — Fastify + Firebase Integration

## Overview

This document explains how CycleBreaker SA combines **deterministic matching** (Fastify + PostgreSQL) with **realtime features** (Firebase) to balance trust, explainability, and modern UX.

**Core Principle**: Use the best tool for each job. Deterministic rules for matching (auditable, explainable), Firebase for realtime collaboration (messaging, groups, queues).

---

## Architecture Comparison

### Current MVP Architecture (Phase 1)
```
┌─────────────┐
│   Next.js   │ PWA
│   React     │
└──────┬──────┘
       │ HTTP/REST
┌──────▼──────────┐
│   Fastify API   │
│  (Node.js)      │
├─────────────────┤
│ JSON-logic      │ Deterministic matching
│ Eligibility     │ Explainability
└──────┬──────────┘
       │
┌──────▼──────────┐
│ PostgreSQL      │ Canonical data
│ (or SQLite MVP) │
└─────────────────┘
```

### Hybrid Architecture (Phase 2-3)
```
┌─────────────────────────────────────────┐
│              Next.js PWA                │
│  (React + Service Worker + IndexedDB)  │
└────┬──────────────────────┬─────────────┘
     │                      │
     │ HTTP/REST            │ WebSocket/Realtime
     │                      │
┌────▼───────────┐   ┌──────▼─────────────┐
│  Fastify API   │   │  Firebase          │
│  (Matching)    │   │  (Realtime)        │
├────────────────┤   ├────────────────────┤
│ JSON-logic     │   │ Realtime DB        │
│ Eligibility    │   │ (messaging, queues)│
│ Feed ranking   │   ├────────────────────┤
│ Provenance     │   │ Storage            │
│                │   │ (documents, photos)│
│                │   ├────────────────────┤
│                │   │ Auth               │
│                │   │ (optional JWT alt) │
└────┬───────────┘   └────────────────────┘
     │
┌────▼───────────┐
│  PostgreSQL    │ Canonical opportunity data
│  (primary DB)  │ User profiles
└────────────────┘
```

**Key Points**:
- Fastify remains the source of truth for opportunities and profiles
- Firebase adds realtime features without replacing core logic
- Both systems can operate independently (resilience)
- Gradual migration path from MVP to full-scale

---

## When to Use Each System

### Use Fastify + PostgreSQL For:
✅ **Opportunity matching** (deterministic, auditable)
✅ **Eligibility evaluation** (JSON-logic rules)
✅ **Feed ranking** (explainable scoring)
✅ **Profile management** (canonical CRUD)
✅ **Provenance tracking** (source_url, last_verified)
✅ **Admin verification** (manual review workflows)

**Why**: These features require explainability, auditability, and complex queries. PostgreSQL excels at relational data and transactions.

### Use Firebase For:
✅ **Realtime messaging** (employer ↔ job seeker)
✅ **Group features** (stokvels, community finance)
✅ **Queue tracking** (clinic wait times, community-reported)
✅ **Document uploads** (Firebase Storage: photos, IDs)
✅ **Push notifications** (Firebase Cloud Messaging)
✅ **Collaborative features** (forum threads, live updates)

**Why**: These features need low-latency, bidirectional updates. Firebase handles realtime sync and offline support out-of-the-box.

---

## Module-by-Module Integration

### Module 1: Jobs
**Fastify Handles**:
- Job posting storage and indexing
- Eligibility matching against user profile
- Transport cost scoring
- Job feed ranking (by match_score, freshness, distance)

**Firebase Adds**:
- Realtime employer ↔ job seeker messaging
- Application status updates (push notifications)
- Interview scheduling (collaborative calendar)

**Data Flow**:
1. Fastify `/feed` returns matched jobs
2. User clicks "Message Employer" → Opens Firebase Realtime DB chat
3. Message sent → Firebase notifies employer via FCM
4. Employer responds → Firebase syncs to user's device
5. User saves job → Fastify stores in PostgreSQL `saved_opportunities`

### Module 2: Skills/Education
**Fastify Handles**:
- Training program catalog
- Skill matching to local jobs
- Progress tracking (courses completed)

**Firebase Adds**:
- Realtime quiz progress (multi-device sync)
- Credential wallet (Firebase Storage for certificates)
- Collaborative learning groups (forum threads)

**Data Flow**:
1. User starts quiz → Fastify serves questions
2. User answers → Firebase syncs progress realtime
3. User completes → Fastify updates profile `skills[]`
4. User uploads certificate → Firebase Storage, metadata to PostgreSQL

### Module 3: Money & Financial Literacy
**Fastify Handles**:
- Budgeting calculator logic
- Savings goal tracking
- Financial literacy content catalog

**Firebase Adds**:
- Stokvel group management (realtime ledger)
- Member contributions (Firebase Realtime DB)
- Group chat for stokvels
- Transaction notifications (Firebase Cloud Messaging)

**Data Flow**:
1. User creates stokvel → Fastify creates group record in PostgreSQL
2. User invites members → Firebase Realtime DB for live member list
3. Member contributes → Firebase updates ledger, notifies group
4. Group syncs to Fastify for monthly reporting/analytics

**Schema Example**:
```typescript
// PostgreSQL (Fastify)
stokvel_groups {
  id: uuid,
  name: string,
  created_by: user_id,
  firebase_path: string, // e.g., "/stokvels/abc123"
  member_count: int,
  total_contributions: decimal,
  created_at: timestamp,
}

// Firebase Realtime DB
/stokvels/{group_id}/ {
  members: {
    user1: { name, joined_at, total_contributed },
    user2: { ... },
  },
  transactions: {
    tx1: { user_id, amount, timestamp, type },
    tx2: { ... },
  },
  chat: {
    msg1: { user_id, text, timestamp },
    msg2: { ... },
  },
}
```

### Module 4: Government Services
**Fastify Handles**:
- SASSA eligibility rules
- Document checklists
- Grant application workflow steps
- Status tracking (application submitted, pending, approved)

**Firebase Adds**:
- Document photo uploads (Firebase Storage)
- OCR processing queue (Firebase Functions + NVIDIA AI)
- SMS reminders (Firebase Cloud Messaging + SMS gateway)
- Community tips forum (realtime threads)

**Data Flow**:
1. User starts grant application → Fastify creates application record
2. User uploads ID photo → Firebase Storage, triggers OCR function
3. OCR validates → Updates application status in PostgreSQL
4. Application submitted → Fastify tracks status
5. SMS reminder sent → Firebase Cloud Messaging + SMS gateway

### Module 5: Health (NEW)
**Fastify Handles**:
- Clinic directory (address, hours, services)
- Appointment reminders schedule
- Health literacy content catalog

**Firebase Adds**:
- Realtime queue tracking (community-reported wait times)
- Appointment reminders (Firebase Cloud Messaging)
- Medication adherence tracking (Firebase Realtime DB)

**Data Flow**:
1. User searches clinics → Fastify returns nearby clinics
2. User reports queue time → Firebase updates `/clinics/{id}/queue`
3. Other users see updated wait time (realtime)
4. User sets appointment → Fastify schedules reminder, Firebase sends notification

**Schema Example**:
```typescript
// PostgreSQL (Fastify)
clinics {
  id: uuid,
  name: string,
  address: string,
  geohash: string,
  operating_hours: jsonb,
  services: string[],
}

// Firebase Realtime DB
/clinics/{clinic_id}/queue {
  current_wait_minutes: 45,
  last_reported_at: timestamp,
  reported_by: user_id,
  reports_count: 12, // for reliability scoring
}
```

### Module 6: Debt Management (NEW)
**Fastify Handles**:
- Debt record storage (encrypted)
- Mashonisa risk analysis (via NVIDIA AI)
- Repayment prioritization algorithm
- Legitimate lender directory

**Firebase Adds**:
- Realtime debt tracker updates (multi-device sync)
- Negotiation SMS templates
- Support group chat (debt counseling)

**Data Flow**:
1. User enters loan → Fastify stores encrypted debt record
2. Fastify calls NVIDIA AI for risk analysis
3. Risk score > threshold → Show warning, suggest alternatives
4. User tracks repayments → Firebase syncs realtime
5. Monthly summary → Fastify generates report from PostgreSQL

---

## Firebase Setup (Phase 2, Week 9-12)

### 1. Create Firebase Project
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init

# Select:
# - Realtime Database
# - Storage
# - Cloud Messaging (optional, Phase 3)
# - Functions (optional, Phase 3 for OCR)
```

### 2. Install Firebase Admin SDK
```bash
npm install firebase-admin
```

### 3. Generate Service Account Key
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `serviceAccountKey.json` (DO NOT COMMIT)
4. Add to `.env`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   ```

### 4. Initialize Firebase in API
```typescript
// apps/api/src/firebase.ts
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

export const db = admin.database();
export const storage = admin.storage();
export const messaging = admin.messaging();
```

### 5. Security Rules (Firebase Realtime DB)
```json
{
  "rules": {
    "stokvels": {
      "$groupId": {
        ".read": "auth != null && data.child('members').child(auth.uid).exists()",
        ".write": "auth != null && data.child('members').child(auth.uid).exists()",
        "transactions": {
          ".indexOn": ["timestamp"]
        }
      }
    },
    "clinics": {
      "$clinicId": {
        "queue": {
          ".read": true,
          ".write": "auth != null"
        }
      }
    },
    "messages": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

### 6. Frontend Firebase SDK
```bash
npm install firebase
```

```typescript
// apps/web/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const storage = getStorage(app);
```

---

## Example: Stokvel Group Chat (Firebase Realtime DB)

### Backend: Create Stokvel
```typescript
// apps/api/src/routes/stokvels.ts
import { db } from '../firebase';

export async function createStokvel(request, reply) {
  const { name, user_id } = request.body;
  
  // 1. Create group in PostgreSQL (canonical record)
  const groupId = crypto.randomUUID();
  await pg.query(
    'INSERT INTO stokvel_groups (id, name, created_by, firebase_path) VALUES ($1, $2, $3, $4)',
    [groupId, name, user_id, `/stokvels/${groupId}`]
  );
  
  // 2. Initialize Firebase Realtime DB structure
  await db.ref(`stokvels/${groupId}`).set({
    name,
    created_at: Date.now(),
    created_by: user_id,
    members: {
      [user_id]: {
        name: 'Creator', // TODO: fetch from profile
        joined_at: Date.now(),
        total_contributed: 0,
      },
    },
    transactions: {},
    chat: {},
  });
  
  return reply.send({ id: groupId, firebase_path: `/stokvels/${groupId}` });
}
```

### Frontend: Listen to Chat
```typescript
// apps/web/components/StokvelChat.tsx
import { useEffect, useState } from 'react';
import { ref, onValue, push } from 'firebase/database';
import { database } from '@/lib/firebase';

export function StokvelChat({ groupId }: { groupId: string }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  useEffect(() => {
    const chatRef = ref(database, `stokvels/${groupId}/chat`);
    
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.entries(data).map(([id, msg]) => ({ id, ...msg }));
        setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
      }
    });
    
    return () => unsubscribe();
  }, [groupId]);
  
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const chatRef = ref(database, `stokvels/${groupId}/chat`);
    await push(chatRef, {
      user_id: 'current_user_id', // TODO: get from auth
      text: newMessage,
      timestamp: Date.now(),
    });
    
    setNewMessage('');
  };
  
  return (
    <div>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.user_id}</strong>: {msg.text}
          </div>
        ))}
      </div>
      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

---

## Cost Estimation

### Firebase Free Tier (Spark Plan)
- **Realtime DB**: 1GB storage, 10GB/month download
- **Storage**: 5GB, 1GB/day download
- **Cloud Messaging**: Unlimited

**Estimate for MVP Beta (100 users)**:
- Stokvels: ~10 groups × 50KB each = 500KB
- Messages: 1000 msgs/month × 1KB = 1MB
- Documents: 100 uploads × 500KB = 50MB
- **Total**: Well within free tier

### Firebase Blaze Plan (Pay-as-you-go)
**When to upgrade**: >1GB Realtime DB or >5GB Storage

**Estimate for 10,000 users**:
- Realtime DB: ~2GB = $5/month
- Storage: ~100GB = $2.60/month
- Bandwidth: ~50GB/month = $5/month
- **Total**: ~$13/month

**Cost control**:
- Cache frequently accessed data in PostgreSQL
- Compress images before upload
- Set TTL on realtime data (e.g., queue times expire after 1 hour)
- Use Firebase Storage lifecycle rules (delete old documents)

---

## Migration Path: MVP → Hybrid

### Week 1-12: MVP (Fastify only)
✅ Build core matching engine
✅ Profile + opportunity CRUD
✅ JSON-logic eligibility
✅ Explainability
✅ Offline PWA with IndexedDB

**No Firebase yet** — validate core hypothesis first

### Week 9-12: Firebase Setup (Parallel Track)
🔄 Create Firebase project
🔄 Set up Realtime DB and Storage
🔄 Implement one test feature (e.g., stokvel chat)
🔄 Measure performance and cost

**Decision point**: Continue with Firebase if:
- Users request realtime features
- Firebase free tier sufficient for beta
- Integration complexity manageable

### Week 13-24: Add Realtime Features
✅ Stokvel groups (Money module)
✅ Employer messaging (Jobs module)
✅ Clinic queue tracking (Health module)

**Keep Fastify as primary** — Firebase is additive, not replacement

### Week 25+: Full Integration
✅ Document uploads (Government Services)
✅ Push notifications (Appointments, reminders)
✅ Community forum (realtime threads)

---

## Offline Strategy (Hybrid)

### Fastify Data (Deterministic, Cacheable)
**Stored in**: Service Worker Cache + IndexedDB

```typescript
// Service Worker: Cache feed API responses
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/feed')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          return caches.open('cyclebreaker-v1').then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

### Firebase Data (Realtime, Synced)
**Stored in**: Firebase Local Persistence (IndexedDB)

```typescript
// Firebase automatically syncs when online
import { enablePersistence } from 'firebase/database';

enablePersistence(database).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence disabled');
  }
});
```

**Result**: User can:
- View cached feed (Fastify) offline
- Read stokvel chat history (Firebase) offline
- Post messages offline → sync when back online

---

## Security Considerations

### Fastify API
- JWT authentication for profile/feed endpoints
- Rate limiting (fastify-rate-limit)
- Input validation (zod schemas)
- SQL injection protection (parameterized queries)

### Firebase
- Authentication via Firebase Auth (or pass JWT from Fastify)
- Security rules enforce user ownership (see rules above)
- Storage rules prevent unauthorized access
- No direct DB access from web (always via API for sensitive data)

### Hybrid Security Pattern
```typescript
// Frontend: Get Firebase token using Fastify JWT
const fastifyToken = localStorage.getItem('jwt');

// Exchange for Firebase custom token
const firebaseToken = await fetch('/api/firebase-token', {
  headers: { Authorization: `Bearer ${fastifyToken}` },
}).then(r => r.json());

// Sign in to Firebase
import { signInWithCustomToken } from 'firebase/auth';
await signInWithCustomToken(auth, firebaseToken);
```

**Benefit**: Single source of truth for auth (Fastify), Firebase tokens short-lived

---

## Testing Strategy

### Unit Tests
- **Fastify**: Test matching logic, eligibility, ranking (existing)
- **Firebase**: Test Firebase interactions with emulators

```bash
npm install -D firebase-tools
firebase emulators:start --only database,storage
```

```typescript
// test/stokvel.test.ts
import { connectDatabaseEmulator } from 'firebase/database';

beforeAll(() => {
  connectDatabaseEmulator(database, 'localhost', 9000);
});

it('should create stokvel group', async () => {
  const ref = await push(ref(database, 'stokvels'), {
    name: 'Test Group',
    created_by: 'user123',
  });
  expect(ref.key).toBeDefined();
});
```

### Integration Tests
- Test Fastify → Firebase flow (e.g., create stokvel in PostgreSQL, initialize in Firebase)
- Test Firebase → Fastify sync (e.g., transaction in Firebase triggers PostgreSQL update)

---

## Monitoring

### Fastify Metrics
- Request latency (fastify-metrics)
- Error rates
- Database query performance

### Firebase Metrics
- Firebase Console: Usage dashboard
- Realtime DB reads/writes per second
- Storage bandwidth
- Function invocations (if using Cloud Functions)

### Combined Dashboard
- Grafana + Prometheus for unified view
- Alert on Firebase cost thresholds
- Track Fastify ↔ Firebase sync lag

---

## Conclusion

The hybrid architecture gives CycleBreaker SA the best of both worlds:
- **Trust & Explainability**: Deterministic Fastify engine for matching
- **Modern UX**: Firebase realtime features for collaboration
- **Cost Control**: PostgreSQL primary, Firebase additive
- **Resilience**: Both systems can operate independently
- **Flexibility**: Gradual migration path from MVP

**Start simple**: MVP with Fastify only. **Add Firebase incrementally** when realtime features provide clear user value.
