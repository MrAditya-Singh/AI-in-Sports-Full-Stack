# ATHLETIX 🏆
### *AI-Powered Mobile Platform for Democratizing Sports Talent Assessment*

> **"Talent is everywhere. Assessment is not. Practice privately, submit only your best attempt."**

---

![ATHLETIX Banner](C:\Users\Dell\.gemini\antigravity-ide\brain\47fd03c1-bfce-4a88-9ee4-1413c0740053\athletix_banner_1787695185782.jpg)

---

<div align="center">

[![Smart India Hackathon 2026](https://img.shields.io/badge/Smart%20India%20Hackathon-2026-orange?style=for-the-badge)](https://www.sih.gov.in/)
[![Ministry](https://img.shields.io/badge/Ministry-Youth%20Affairs%20%26%20Sports-blue?style=for-the-badge)](https://yas.nic.in/)
[![Category](https://img.shields.io/badge/Category-Fitness%20%26%20Sports-green?style=for-the-badge)]()
[![Team](https://img.shields.io/badge/Team-Billo's%20Crew-purple?style=for-the-badge)]()

[![React Native](https://img.shields.io/badge/React%20Native-Expo-61DAFB?style=flat-square&logo=react)](https://expo.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Cloudinary](https://img.shields.io/badge/Video-Cloudinary-3448C5?style=flat-square)](https://cloudinary.com/)
[![MediaPipe](https://img.shields.io/badge/AI-MediaPipe%20BlazePose-FF6F00?style=flat-square)](https://mediapipe.dev/)

</div>

---

## 📋 Table of Contents

1. [Problem Statement and Vision](#1-problem-statement--vision)
2. [What is ATHLETIX?](#2-what-is-athletix)
3. [How It Works — The Core Loop](#3-how-it-works--the-core-loop)
4. [Target Users and Roles](#4-target-users--roles)
5. [Supported Sports and Exercises](#5-supported-sports--exercises)
6. [Feature Set](#6-feature-set)
7. [System Architecture](#7-system-architecture)
8. [AI Analysis Pipeline (Deep Dive)](#8-ai-analysis-pipeline-deep-dive)
9. [Tech Stack](#9-tech-stack)
10. [Database Schema](#10-database-schema)
11. [API Reference](#11-api-reference)
12. [Folder and File Structure](#12-folder--file-structure)
13. [Build Roadmap — Phase by Phase](#13-build-roadmap--phase-by-phase)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Security, Privacy and Development Rules](#15-security-privacy--development-rules)
16. [Success Metrics](#16-success-metrics)
17. [AI Model Strategy](#17-ai-model-strategy)
18. [Scope — In, Out and Future](#18-scope--in-out--future)
19. [Getting Started — Local Setup](#19-getting-started--local-setup)
20. [Environment Variables](#20-environment-variables)
21. [Third-Party Services](#21-third-party-services)
22. [Team](#22-team)

---

## 1. Problem Statement & Vision

### 🔴 The Gap

India's sports ecosystem has a fundamental discovery problem. The country of 1.4 billion people — many of them athletically gifted — runs its talent identification almost exclusively through:

- **Physical scouting camps** concentrated in urban centers
- **Recommendations from coaches** that require geographic proximity
- **Bandwidth-heavy assessments** dependent on travel and infrastructure

The result? A vast reservoir of talent from **rural, semi-urban, and remote regions goes completely undetected** — not because the ability isn't there, but because the assessment infrastructure isn't there.

A talented powerlifter training in a gym in Bastar, a calisthenics prodigy doing pull-ups on a bar in a village in Manipur, a teenage athlete in Bihar who has never been near a scouting camp — all of these athletes are **invisible to the national sports system** simply because of geography.

### ✅ The Vision

**ATHLETIX** is built on a single premise: *a smartphone camera is now capable of being a world-class scout.*

By combining pose estimation, sport-specific biomechanical analysis, and AI scoring — delivered through a simple mobile app — we give every athlete access to:

- An **objective, standardized** performance assessment
- Immediate, structured **feedback on their form and technique**
- Visibility on a **national leaderboard** ranked by genuine performance
- A pathway to be **discovered by sports officials and government scouts** without ever leaving their town

This platform directly serves the **Ministry of Youth Affairs and Sports'** mandate to identify and nurture athletic talent from every corner of India — democratizing access to sports scouting in a way that no physical camp or regional event ever could.

> *"Talent is everywhere. Assessment is not. ATHLETIX changes that."*

---

## 2. What is ATHLETIX?

ATHLETIX is a **cross-platform mobile application** built with React Native (Expo) for athletes, coaches, and government sports officials. It is backed by a Python FastAPI server, a PostgreSQL database (via Supabase), Cloudinary video infrastructure, and a custom AI/Computer Vision pipeline powered by MediaPipe BlazePose.

### The Four-Step User Journey

```
1. PRIVATE PRACTICE          2. DELIBERATE SUBMISSION
   Athletes practice             Athlete submits only their best
   anytime, anywhere             attempt (video), anywhere,
   in a private, secure          from a private & secure space.
   space.

         |                              |
         v                              v

3. AI ASSESSMENT             4. DISCOVERY & SELECTION
   AI analyzes using pose        Top performers are discovered
   estimation rules and          by coaches & scouts and
   machine learning models.      shortlisted for opportunities.
   Coaches make the final call.
```

**AI powers the leaderboard and contest screening — coaches make the final call.**

---

## 3. How It Works — The Core Loop

```
Athlete records their performance at home / gym / field
          |
          v
Selects sport (Powerlifting or Calisthenics) + specific exercise
          |
          v
Uploads MP4 video (1-2 minutes) via the ATHLETIX app
          |
          v
Backend receives upload
  --> saves to Cloudinary (compressed for low-bandwidth)
  --> video status: PENDING
          |
          v
AI Pipeline triggered asynchronously:
  [Frame Extraction]
  --> [MediaPipe BlazePose: Keypoint Detection]
  --> [Exercise-Specific Metric Extraction]
  --> [Scoring Engine: Score + Strengths + Weaknesses + Suggestions]
  --> Write to assessments table
  --> video status: COMPLETED
          |
          v
Athlete receives push notification: "Your AI Report is Ready"
          |
          v
Athlete views detailed report + sees leaderboard rank
          |
          v
Sports Official reviews high-scoring athletes
  --> Verifies performance authenticity
  --> Shortlists athletes for further selection
```

---

## 4. Target Users & Roles

ATHLETIX is a **role-based platform** with three distinct user types, each with dedicated dashboards and access controls enforced at the database level:

| Role | Who They Are | What They Can Do |
|------|-------------|-----------------|
| **Athlete** | Any individual recording themselves performing a sport/exercise — from rural villages to city gyms | Sign up, select sport/exercise, upload video, receive AI report, view leaderboard rank, track performance history, receive notifications |
| **Sports / Govt Official** | Government-appointed scouts, sports authority representatives, coaches with official credentials | Review AI-assessed athlete profiles, watch videos, verify performance authenticity (adds a trust badge), shortlist athletes for further selection |
| **Admin** | Platform owner/operator | Full platform visibility: user management, video content oversight, flagged content review, platform-wide analytics |

### Role-Based Data Isolation (Row-Level Security)

Each role sees **only what they're supposed to see**, enforced at the database level by Supabase Row-Level Security (RLS):

- **Athletes** → only their own videos, reports, and notifications
- **Officials** → athlete profiles and reports; not other officials' shortlists
- **Admins** → full platform visibility across all records

---

## 5. Supported Sports & Exercises

ATHLETIX v1.0 ships with **2 sports** and **6 exercises** — chosen for the clearest pose-estimation signal and maximum demonstrability:

### Powerlifting — Form & Technique Scoring

| Exercise | What AI Evaluates |
|----------|------------------|
| **Squat** | Hip crease depth vs. knee, knee tracking over toes, torso angle, lockout at top |
| **Bench Press** | Bar path linearity, elbow angle, arch consistency, lockout quality |
| **Deadlift** | Hip hinge mechanics, spine neutrality, bar path, lockout position |

### Calisthenics — Form Scoring + Rep Counting

| Exercise | What AI Evaluates |
|----------|------------------|
| **Push-ups** | Elbow angle at bottom (ROM), body alignment (plank position), lockout at top, rep count |
| **Pull-ups** | Chin-over-bar standard, elbow extension at bottom, body swing, rep count |
| **Handstand** | Hold duration, balance quality (shoulder-over-wrist alignment), body line straightness |

> **Design Decision:** Athletes manually select their sport and exercise. Auto-detection of exercise type is deliberately out of scope for v1 — explicit selection ensures accurate pipeline routing and avoids misclassification false negatives in a demo environment.

---

## 6. Feature Set

### 6.1 Authentication

- **Role-based signup and login** (Athlete / Official / Admin)
- Powered by **Supabase Auth** with JWT tokens
- Role assigned at signup, embedded in JWT, enforced on both frontend route guards and backend middleware
- Secure token refresh; no credentials stored client-side beyond the auth token

### 6.2 Role-Specific Dashboards

**Athlete Dashboard:**
- Overview of past AI reports and scores
- Current leaderboard position per sport/exercise
- Verification badge status (if verified by an official)
- Notification center (report ready, shortlisted, verified)

**Official Dashboard:**
- Browse AI-assessed athletes filterable by sport, exercise, and score
- View individual AI reports + embedded video playback
- One-click **Verify** → adds verification badge to athlete profile
- One-click **Shortlist** → adds athlete to official's shortlist

**Admin Dashboard:**
- Platform-wide analytics: total signups, videos analyzed, avg. time-to-report, total shortlists
- User management: view and manage athletes and officials
- Content oversight: review uploaded videos, flag inappropriate content

### 6.3 Video Upload (Athlete-Controlled Submission)

- **Pre-recorded video upload only** — athlete decides what to submit, on their terms
- Format: **MP4 only** (validated client-side before upload)
- Duration: **1–2 minutes** (validated pre-upload)
- Uploaded to **Cloudinary** with automatic compression for rural/low-bandwidth delivery
- Upload status tracked: `pending` → `processing` → `completed` / `failed`
- Async upload UX: athlete is not blocked waiting; they are notified when the report is ready

> **Privacy Design:** The athlete controls exactly what they submit. Nothing is recorded automatically. This builds trust — particularly important for communities with lower digital literacy.

### 6.4 AI Video Analysis

Full pipeline: **Computer Vision + Pose Estimation → Metric Extraction → Scoring Engine → Structured Report**

For each video, the AI produces:
- **Score** (0–100 numerical scale)
- **Strengths** (what the athlete does well)
- **Weaknesses** (identified form errors)
- **Suggestions** (specific, actionable improvement notes)
- **Rep Count** (for calisthenics exercises)

### 6.5 Leaderboard (Contest-Style, AI-Score Driven)

- Ranks athletes **purely by their AI score**, per sport/exercise
- Fair and unbiased — score is objective, derived from biomechanical analysis
- **Verification badge**: a tick mark visible on an athlete's profile when a sports official manually verifies their performance. This is a **trust signal**, not a ranking factor — the leaderboard rank is AI-driven only.

### 6.6 Notifications (Push + In-App)

Triggered for:
- AI report is ready
- Official has verified performance
- Athlete has been shortlisted by an official
- New athlete submission available for review (official-side)

Powered by **Expo Push Notifications** + **FastAPI background tasks**.

### 6.7 Real-Time Form Guidance (Pre-Submission)

- Athletes receive live feedback on form, posture, and technique before finalizing a submission
- Encourages multiple practice attempts, improves overall quality of data entering the AI pipeline

---

## 7. System Architecture

### 7.1 High-Level Overview

```
                    +-----------------------------------+
                    |      React Native (Expo) App      |
                    |   Athlete / Official / Admin      |
                    |   Cross-platform: Android + iOS   |
                    +---------------+-------------------+
                                    |  REST API (HTTPS)
                                    v
                    +-----------------------------------+
                    |         FastAPI Backend           |
                    |  +-----------------------------+  |
                    |  |  Auth . Users . Videos      |  |
                    |  |  Leaderboard . Notifications|  |
                    |  |  Verifications . Shortlists |  |
                    |  +-----------------------------+  |
                    |  +-----------------------------+  |
                    |  |    AI & Video Analysis      |  |
                    |  |    Pipeline (services/ai/)  |  |
                    |  |  Pose Estimation + Metrics  |  |
                    |  |  + Scoring Engine           |  |
                    |  +-----------------------------+  |
                    +------------+----------+-----------+
                                 |          |
                    +------------v----+ +---v-------------------+
                    |  Supabase       | |  Cloudinary            |
                    |  Postgres DB    | |  Video Storage         |
                    |  + Auth         | |  Auto-Compression      |
                    |  + Row-Level    | |  CDN Delivery          |
                    |  Security (RLS) | |  (Low-bandwidth rural) |
                    +-----------------+ +------------------------+
```

**Flow summary:** The mobile app talks only to FastAPI over HTTPS REST. FastAPI handles auth verification (via Supabase), business logic, and triggers the AI pipeline on uploaded videos. Videos live in Cloudinary (optimized for low-bandwidth delivery); structured data (users, scores, leaderboard, verifications) lives in Supabase Postgres.

### 7.2 Architecture Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| Mobile-first (React Native / Expo) | The problem lives in rural India — smartphones are the primary computing device. Expo gives a single codebase for Android and iOS. |
| FastAPI backend (Python) | Same language as the AI/CV pipeline — no cross-language marshalling. Async support handles concurrent video processing. |
| Supabase (Postgres + Auth + RLS) | Relational schema is correct (leaderboard rankings need joins). Supabase bundles Auth + RLS out of the box. Free tier sufficient. |
| Cloudinary for video | Auto-compression and CDN delivery are non-negotiable for rural/low-bandwidth users. Handled in a single SDK call. |
| AI pipeline isolated in services/ai/ | The scoring logic is the platform's core IP. Isolating it means it can be extracted into a standalone microservice as load grows — without restructuring the backend. |
| No in-app video recording | Keeps app size small; respects athlete agency — they submit their best take on their terms. |

### 7.3 Data Flow

```
Mobile App (HTTPS REST)
    |
    v
FastAPI --> Supabase Auth verification (every request)
    |
    +-- Video Upload --> Cloudinary (store) + Supabase (metadata, status=pending)
    |
    +-- AI Trigger (async background task)
    |       |
    |       v
    |   Cloudinary: download video for processing
    |       |
    |       v
    |   MediaPipe BlazePose: frame-by-frame keypoint extraction
    |       |
    |       v
    |   Exercise-specific metric extractor
    |       |
    |       v
    |   Scoring engine --> score + strengths + weaknesses + suggestions
    |       |
    |       v
    |   Write to assessments table, update video status=completed
    |       |
    |       v
    |   Trigger push notification --> Athlete
    |
    +-- Leaderboard query --> Supabase (derived view, sorted by AI score)
```

---

## 8. AI Analysis Pipeline (Deep Dive)

The AI pipeline is the heart of ATHLETIX. It converts raw video into structured, actionable, sport-specific performance intelligence.

### 8.1 Pipeline Flow

```
Video Upload (MP4, 1-2 min)
       |
       v
Pre-validation
  - File type check (MP4 only — reject early, don't waste compute)
  - Duration check (1-2 min window)
  - Frame count sanity check (detect corrupted/blank videos)
       |
       v
Preprocessing
  - Frame extraction (sample at consistent FPS, e.g. 15 fps)
  - Resolution normalization (standardize for model input)
       |
       v
Pose Estimation — MediaPipe BlazePose
  - 33 body landmark keypoints (x, y, z, visibility) per frame
       |
       v
Exercise-Specific Metric Extraction
  Powerlifting:
    Squat        -- hip crease depth vs knee line, knee tracking,
                    torso angle at bottom, lockout quality at top
    Bench Press  -- bar path proxy (wrist trajectory), elbow angle
                    at bottom, arch consistency, lockout
    Deadlift     -- hip hinge angle, spine deviation from neutral,
                    bar path (wrist vs body), lockout position
  Calisthenics:
    Push-up      -- elbow angle at bottom (ROM), body plank line,
                    lockout at top, rep state machine (up/down count)
    Pull-up      -- chin-over-bar detection, elbow extension at bottom,
                    body swing penalty, rep state machine
    Handstand    -- shoulder-over-wrist alignment, body line
                    straightness, hold duration tracking
       |
       v
Scoring Engine
  - Rule-based component scoring per metric
  - Weighted aggregation --> overall score (0-100)
  - Strength detection (metrics above threshold)
  - Weakness detection (metrics below threshold)
  - Suggestion generation (templated, per weakness identified)
       |
       v
Write to DB
  - assessments table: score, strengths[], weaknesses[], suggestions[],
                       rep_count (calisthenics), created_at
  - videos table: status --> 'completed' (or 'failed' on error)
       |
       v
Push Notification --> Athlete ("Your AI Report is Ready")
```

### 8.2 Failure Handling in the AI Pipeline

| Failure Scenario | Handling |
|-----------------|---------|
| No person detected in video | Video status → `failed`; human-readable error returned |
| Video is corrupted or blank | Pre-validation catches before wasting compute; early rejection |
| Wrong exercise selected | Score reflects mismatch; athlete guided to re-submit |
| MediaPipe low-confidence keypoints | Low-confidence frames filtered out; graceful degradation on insufficient valid frames |
| Processing timeout | Background task timeout handler; video marked `failed`; athlete notified |

### 8.3 Error Response Shape

```json
{
  "success": false,
  "error": {
    "code": "VIDEO_PROCESSING_FAILED",
    "message": "Could not detect a person in the video. Please ensure your full body is visible in the frame."
  }
}
```

---

## 9. Tech Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Mobile Frontend | React Native (Expo) | SDK 51+ | Fast Android build cycle; camera/file-picker libraries mature; single codebase for Android + iOS |
| Backend Framework | Python + FastAPI | 0.111+ | Team's Python comfort; async support; same language as AI/CV pipeline |
| Database | PostgreSQL via Supabase | Latest | Relational model correct for joins; Supabase bundles Auth + RLS |
| Authentication | Supabase Auth | — | Role-based auth out of the box; JWT tokens |
| Video Storage | Cloudinary | — | Free 25GB; auto-compression; CDN delivery for rural/low-bandwidth |
| Pose Estimation | MediaPipe BlazePose | 0.10+ | Proven, pretrained; 33 high-quality 3D keypoints; Python-native |
| AI Scoring Layer | Custom Python module | — | Core IP: rep counting, form-error detection, joint-angle analysis |
| Notifications | Expo Push + FastAPI background tasks | — | Lightweight; no extra infrastructure needed |
| HTTP Client (mobile) | Axios / Fetch API | — | Standard REST; interceptors for auth token injection |

---

## 10. Database Schema

All tables live in Supabase-managed PostgreSQL. RLS policies are enforced at the Supabase level.

### 10.1 Tables

```sql
-- Users (extended from Supabase Auth)
CREATE TABLE users (
  id         UUID PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  role       TEXT CHECK (role IN ('athlete','official','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Athlete extended profile
CREATE TABLE athlete_profiles (
  user_id  UUID PRIMARY KEY REFERENCES users(id),
  age      INT,
  gender   TEXT,
  location TEXT,
  bio      TEXT
);

-- Videos uploaded by athletes
CREATE TABLE videos (
  id          UUID PRIMARY KEY,
  athlete_id  UUID REFERENCES users(id),
  sport       TEXT NOT NULL,
  exercise    TEXT NOT NULL,
  video_url   TEXT NOT NULL,
  status      TEXT DEFAULT 'pending',
  error_msg   TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Assessment results
CREATE TABLE assessments (
  id          UUID PRIMARY KEY,
  video_id    UUID REFERENCES videos(id) UNIQUE,
  score       NUMERIC(5,2),
  strengths   TEXT[],
  weaknesses  TEXT[],
  suggestions TEXT[],
  rep_count   INT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Official verifications
CREATE TABLE verifications (
  id          UUID PRIMARY KEY,
  athlete_id  UUID REFERENCES users(id),
  official_id UUID REFERENCES users(id),
  video_id    UUID REFERENCES videos(id),
  exercise    TEXT,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- Official shortlists
CREATE TABLE shortlists (
  id          UUID PRIMARY KEY,
  official_id UUID REFERENCES users(id),
  athlete_id  UUID REFERENCES users(id),
  sport       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(official_id, athlete_id, sport)
);

-- Notifications
CREATE TABLE notifications (
  id         UUID PRIMARY KEY,
  user_id    UUID REFERENCES users(id),
  message    TEXT NOT NULL,
  type       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.2 Leaderboard View (Derived)

```sql
CREATE VIEW leaderboard_view AS
  SELECT
    v.sport,
    v.exercise,
    v.athlete_id,
    u.name AS athlete_name,
    a.score,
    RANK() OVER (
      PARTITION BY v.sport, v.exercise
      ORDER BY a.score DESC
    ) AS rank,
    EXISTS (
      SELECT 1 FROM verifications vr
      WHERE vr.athlete_id = v.athlete_id AND vr.video_id = v.id
    ) AS is_verified
  FROM assessments a
  JOIN videos v ON a.video_id = v.id
  JOIN users u ON v.athlete_id = u.id
  WHERE v.status = 'completed';
```

### 10.3 RLS Policy Summary

| Table | Athlete | Official | Admin |
|-------|---------|---------|-------|
| `users` | Own row only | Read public fields | Full |
| `videos` | Own rows only | All completed | Full |
| `assessments` | Own (via video) | All | Full |
| `verifications` | Read own | Read/write own | Full |
| `shortlists` | None | Own | Full |
| `notifications` | Own | Own | Full |

---

## 11. API Reference

All routes under `/api/v1/`. Every request requires a valid Supabase JWT Bearer token except `/auth` endpoints.

```
/auth
  POST /auth/signup           Create account, assign role
  POST /auth/login            Login, receive JWT

/users
  GET  /users/me              Fetch own profile
  PUT  /users/me              Update own profile

/videos
  POST /videos/upload         Upload video (MP4, 1-2 min)
  GET  /videos/:id/status     Check processing status
  GET  /videos/mine           List own videos and statuses

/assessments
  GET  /assessments/:video_id Fetch AI report for a video
  GET  /assessments/mine      Fetch all own AI reports

/leaderboard
  GET  /leaderboard           Query: sport, exercise -> ranked list + badges

/verifications
  POST /verifications         Official verifies an athlete's video
  GET  /verifications/:id     Get verification history for an athlete

/shortlists
  POST   /shortlists          Official shortlists an athlete
  DELETE /shortlists/:id      Remove from shortlist
  GET    /shortlists/mine     Official's shortlist

/notifications
  GET  /notifications         Fetch own notifications
  PUT  /notifications/:id/read  Mark notification as read

/admin
  GET  /admin/users           List all users (Admin only)
  PUT  /admin/users/:id       Manage user (Admin only)
  GET  /admin/analytics       Platform-wide metrics (Admin only)
  GET  /admin/videos          All videos with content oversight (Admin only)
```

### Success Response

```json
{
  "success": true,
  "data": { }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable error message."
  }
}
```

HTTP status codes: `200` success, `201` created, `400` bad input, `401` unauthenticated, `403` forbidden (wrong role), `404` not found, `422` validation error, `500` unexpected server error only.

---

## 12. Folder & File Structure

### 12.1 Frontend — React Native / Expo

```
mobile-app/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx               Login screen (all roles)
│   │   └── signup.tsx              Signup with role selection
│   ├── (athlete)/
│   │   ├── dashboard.tsx           Athlete home: reports, leaderboard, notifications
│   │   ├── upload.tsx              Sport/exercise selection + video upload
│   │   ├── reports.tsx             AI report viewer (score, feedback)
│   │   └── leaderboard.tsx         Leaderboard by sport/exercise
│   ├── (official)/
│   │   ├── dashboard.tsx           Official home: athlete list
│   │   ├── review.tsx              Athlete report review + verify action
│   │   └── shortlist.tsx           Shortlist management
│   └── (admin)/
│       ├── dashboard.tsx           Admin analytics overview
│       ├── users.tsx               User management
│       └── analytics.tsx           Platform-wide metrics
├── components/
│   ├── ScoreCard.tsx               AI score display component
│   ├── LeaderboardRow.tsx          Single leaderboard entry with badge
│   ├── VideoUploadPicker.tsx       File picker + upload progress
│   ├── NotificationBell.tsx        Notification icon + count badge
│   └── VerificationBadge.tsx       Tick-style verification mark
├── services/
│   ├── api.ts                      Axios instance with auth interceptor
│   ├── authService.ts              Signup, login, token management
│   ├── videoService.ts             Upload, status polling
│   ├── assessmentService.ts        Fetch reports
│   ├── leaderboardService.ts       Leaderboard queries
│   └── notificationService.ts      Fetch + mark read
├── hooks/
│   ├── useAuth.ts                  Auth state + role
│   ├── useUpload.ts                Upload flow state machine
│   └── useNotifications.ts         Notification state
├── constants/
│   ├── colors.ts                   Design system colors
│   ├── config.ts                   API base URL, config values
│   └── sports.ts                   Sports/exercise enum list
├── assets/
│   ├── icons/
│   └── images/
└── app.json                        Expo configuration
```

### 12.2 Backend — FastAPI

```
backend/
├── app/
│   ├── main.py                     FastAPI app entrypoint, middleware, routers
│   ├── core/
│   │   ├── config.py               Environment variable loading
│   │   └── security.py             JWT verification, role middleware
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── videos.py
│   │       ├── assessments.py
│   │       ├── leaderboard.py
│   │       ├── verifications.py
│   │       ├── shortlists.py
│   │       ├── notifications.py
│   │       └── admin.py
│   ├── models/
│   │   ├── user.py                 Pydantic schemas for users
│   │   ├── video.py                Pydantic schemas for videos
│   │   └── assessment.py           Pydantic schemas for AI reports
│   ├── services/
│   │   ├── cloudinary_service.py   Video upload/fetch/delete ops
│   │   ├── notification_service.py Trigger push notifications
│   │   └── ai/
│   │       ├── pipeline.py         Main pipeline orchestrator
│   │       ├── pose_estimation.py  MediaPipe BlazePose wrapper
│   │       ├── scoring.py          Score aggregation + computation
│   │       └── exercises/
│   │           ├── squat.py        Squat metric extractor
│   │           ├── bench_press.py  Bench press metric extractor
│   │           ├── deadlift.py     Deadlift metric extractor
│   │           ├── pushup.py       Push-up extractor + rep counter
│   │           ├── pullup.py       Pull-up extractor + rep counter
│   │           └── handstand.py    Handstand hold detector + scorer
│   ├── db/
│   │   └── supabase_client.py      Supabase Python client setup
│   └── utils/
│       ├── validators.py           Pre-upload video validation
│       └── logger.py               Python logging setup
├── requirements.txt
└── .env                            Secrets (never committed)
```

---

## 13. Build Roadmap — Phase by Phase

Phases are ordered by **dependency**, not fixed time — scales from a multi-week runway to a 36-hour hackathon crunch.

### Phase 0 — Setup & Foundations

- Initialize repo (frontend + backend as separate folders)
- Supabase project created: Postgres tables from schema, Auth enabled
- Cloudinary account configured, API keys obtained
- `.env` and `.gitignore` set up from commit #1 (secrets never committed)
- Expo project scaffolded with route group shell: `(auth)` / `(athlete)` / `(official)` / `(admin)`
- FastAPI project scaffolded per Architecture.md folder structure

**Exit Criteria:** Empty app boots on Android. Empty FastAPI server returns 200. Supabase DB is reachable.

---

### Phase 1 — Authentication

- Supabase Auth integration: signup and login endpoints
- Role assignment (Athlete / Official / Admin) at signup
- Role-based route protection: frontend guards + backend middleware
- Basic RLS policies applied in Supabase

**Exit Criteria:** All 3 roles can sign up, log in, and land on their role-specific (empty) dashboard.

---

### Phase 2 — Dashboard Skeletons

- Athlete Dashboard: empty state (no reports, leaderboard placeholder, notification bell)
- Official Dashboard: empty athlete list with filter UI shell
- Admin Dashboard: empty analytics view
- Shared navigation, layout components, design tokens

**Exit Criteria:** Each role sees a distinct, functional (but data-empty) dashboard after login.

---

### Phase 3 — Sport/Exercise Selection + Video Upload

- Sport/domain selection UI: Powerlifting (Squat/Bench/Deadlift), Calisthenics (Push-up/Pull-up/Handstand)
- Video file picker with client-side validation (MP4 only, 1-2 min)
- Upload to Cloudinary, save video metadata + status `pending` in Postgres
- Upload progress indicator; async UX (no blocking)

**Exit Criteria:** Athlete can select an exercise, upload a valid MP4, and see it listed as `pending`.

---

### Phase 4 — AI Analysis Pipeline *(Most Critical Phase)*

> Build end-to-end on **ONE exercise first** (recommended: Squat or Push-up — clearest keypoint signal), then replicate the pattern.

- Integrate MediaPipe BlazePose in Python — extract 33-keypoint coordinates per frame
- Build metric extractor for the pilot exercise
- Build scoring engine: 0-100 score + strengths + weaknesses + suggestions
- Write results to `assessments` table, update video status `processing` → `completed` / `failed`
- Display AI report on Athlete Dashboard

**Exit Criteria:** ONE full exercise works end-to-end: upload → AI processes → athlete sees a real score and feedback.

---

### Phase 5 — Expand AI Pipeline to Remaining Exercises

- Replicate Phase 4 pattern to all remaining 5 exercises
- Each exercise has its own metric extractor in `services/ai/exercises/`
- Calisthenics: rep counting state machine validated across push-up, pull-up, handstand
- Edge cases handled: no person detected, wrong exercise selected

**Exit Criteria:** All 6 exercises across both sports produce a working AI report.

---

### Phase 6 — Leaderboard & Verification

- Leaderboard populated from `leaderboard_view` (athletes ranked by AI score per sport/exercise)
- Official flow: browse athlete list → open report → review video + score → click Verify → badge appears
- Shortlist action connected to `shortlists` table

**Exit Criteria:** Leaderboard shows real scores; officials can verify and shortlist; badge shows on athlete side.

---

### Phase 7 — Notifications

- Push notification triggered on: report ready, official verified, shortlisted
- In-app notification list UI
- Mark-as-read action

**Exit Criteria:** User gets notified on key events without manual refresh.

---

### Phase 8 — Admin Analytics

- Admin dashboard with live platform metrics:
  - Total athlete sign-ups
  - Total videos analyzed
  - Average time-to-report
  - Total athletes shortlisted
- Basic user management (view/manage athletes and officials)

**Exit Criteria:** Admin dashboard reflects live, real platform data.

---

### Phase 9 — Polish, Error Handling & Low-Bandwidth Pass

- Apply error handling standards across all FastAPI endpoints
- Test on low-end Android device with throttled network
- Verify Cloudinary compression + async upload UX holds up
- Edge case sweep: corrupted video, wrong exercise, no person in frame, network drop mid-upload

**Exit Criteria:** App does not break on bad input. Feels usable on a slow/weak connection.

---

### Phase 10 — Demo Prep

- Seed realistic demo data: sample athletes, videos, pre-scored assessments as backup
- Rehearse full user journey: athlete uploads → AI scores → official verifies → leaderboard updates
- Prepare pitch narrative connecting to PRD vision (rural access, democratization)

**Exit Criteria:** Team can demo the full loop confidently in under 5 minutes.

---

### Crunch Mode Guidance

> If time is critically short, protect **Phase 4 (one working AI pipeline end-to-end)** above everything else. A single exercise that genuinely works is far stronger than six exercises that are all half-broken. Cut Phase 8 (Admin Analytics) and trim Phase 7 (Notifications) first if forced.

---

## 14. Non-Functional Requirements

| NFR | Requirement | How Architecture Delivers It |
|-----|------------|------------------------------|
| **Reliability** | Consistent uptime; AI processing produces dependable results | FastAPI async processing; explicit video status tracking (pending → processing → completed / failed); failures caught and surfaced, never silently swallowed |
| **Privacy** | Athlete video and personal data protected; access controls enforced per role | Supabase Row-Level Security — database-level enforcement; athletes cannot access each other's data even if an API route is misconfigured |
| **Security** | Secure auth, data storage, and transmission | Supabase Auth JWT on every API request; HTTPS-only; secrets in .env only; no raw stack traces returned to clients |
| **Scalability** | Architecture must accommodate a growing user base | AI module isolated in `services/ai/` — extractable into standalone microservice; stateless FastAPI backend scales horizontally; Cloudinary CDN scales without code changes |
| **Rural / Low-End Compatibility** | Lightweight app on low-bandwidth networks and low-spec Android devices | Cloudinary auto-compression + CDN; async upload with status polling (UI never blocks); lean Expo bundle; no in-app video recording |

---

## 15. Security, Privacy & Development Rules

### 15.1 Tech Stack Discipline
- Stack is **locked** per Architecture.md: React Native (Expo) / FastAPI / Supabase Postgres / Cloudinary / MediaPipe
- No library swaps without explicit team approval
- No new architectural patterns (Redux, ORMs, message queues) without prior discussion

### 15.2 Secret & Config Management
- All API keys and credentials live in `.env` — **never hardcoded**, even temporarily
- `.env` is in `.gitignore` from commit #1 — **never committed**
- No printing secrets to console for debugging

### 15.3 Database & Schema Integrity
- **No schema changes** (new tables, columns, renamed fields) without first surfacing the exact SQL/migration
- No silent field renaming that other code depends on
- RLS policies are **never disabled** "to make testing easier" — this is a security regression
- No direct production DB writes during testing — use dev/staging

### 15.4 API Contract Stability
- Once an endpoint's request/response shape is defined and frontend is built against it, backend cannot silently change it
- Frontend and backend shape changes are always coordinated and co-deployed

### 15.5 AI Pipeline Code Rules
- AI/CV logic stays isolated in `services/ai/` — **never inlined into route handlers**
- Every placeholder/stub is marked `# TODO:` and called out explicitly — no fake-complete code
- Ambiguous business logic (e.g. "what counts as a valid push-up rep") has stated assumptions — never silently chosen

### 15.6 Error Handling Standards
- Consistent error response shape from FastAPI:
```json
{ "success": false, "error": { "code": "VIDEO_PROCESSING_FAILED", "message": "Could not detect a person in the video." } }
```
- Correct HTTP status codes — no returning 500 for everything
- AI pipeline failures (no person detected, corrupted file, wrong exercise) are **expected failures**, not bugs — mark video `failed` with a human-readable reason
- One global exception handler catches anything unhandled — never leak a raw Python stack trace to the client
- Validate uploads **before** running AI — file type, duration, size cap — reject early

### 15.7 Git Discipline
- Never commit video files or large binary assets
- Never commit `.env`
- Meaningful commit messages — no "fix stuff" or "update" (judges review commit history)

---

## 16. Success Metrics

ATHLETIX tracks four core success metrics visible on the Admin Dashboard:

| Metric | What It Measures | Why It Matters |
|--------|----------------|----------------|
| **Athlete Sign-ups** | Total registered athletes | Platform adoption — are we reaching the target users? |
| **Average Time-to-Report** | Time from video upload to AI assessment delivery | AI pipeline efficiency — faster = better UX = more athlete trust |
| **Videos Analyzed** | Total AI assessments completed | Platform usage depth — are athletes submitting and getting assessed? |
| **Athletes Shortlisted** | Total unique athletes shortlisted by officials | Platform outcome — are we actually enabling talent discovery? |

---

## 17. AI Model Strategy

### Why We Don't Train From Scratch

Training a pose estimation model from scratch requires:
- Massive labeled video datasets (hundreds of thousands of examples)
- Weeks of GPU compute time
- Deep ML research expertise in video understanding

This is a **solved problem** with open, production-grade solutions.

### Our Approach: Stand on Giants, Build on Top

```
Layer 1 — Solved, Use Pre-trained
    MediaPipe BlazePose
    - 33 body landmark keypoints per frame
    - Trained on millions of samples
    - Runs fast in Python server-side
    - NOT reinvented

             +

Layer 2 — Our IP, Custom Built
    Sport-specific Assessment Module
    - Per-exercise metric extraction
      (joint angle thresholds, ROM checks, rep state machines)
    - Custom scoring engine (weighted rule-based)
    - Strength/weakness detection
    - Actionable suggestion generation
    - THIS is ATHLETIX's core IP
```

**Optional enhancement (if time permits):** Fine-tune a lightweight classifier on joint-angle/keypoint sequences using a small custom-labeled dataset for improved form-quality scoring beyond rule-based thresholds.

This positions the team's value-add in the **sports-specific assessment layer** — the domain knowledge — not in reinventing solved computer vision fundamentals. A stronger and more honest hackathon narrative.

---

## 18. Scope — In, Out & Future

### In Scope (v1.0)

- Role-based authentication (Athlete / Official / Admin)
- Role-specific dashboards
- Video upload (MP4, 1-2 min, Cloudinary)
- AI analysis pipeline for **2 sports, 6 exercises**
- AI score report (score + strengths + weaknesses + suggestions + rep count)
- Leaderboard (per sport/exercise, AI-score ranked)
- Official verification (badge) + shortlisting
- Push notifications (report ready, verified, shortlisted)
- Admin analytics dashboard

### Out of Scope (v1.0)

- Additional sports beyond Powerlifting and Calisthenics
- Auto-detection of exercise type (athlete manually selects)
- In-app video recording
- AI-driven career roadmap or training plan generation
- Social features (follow, share, community feed)
- Payment or subscription tiers

### Future Scope

| Feature | Description |
|---------|-------------|
| **Additional Sports** | Athletics (sprint form, jump), swimming, football, wrestling |
| **AI Career Guidance** | Personalized training recommendations powered by performance history |
| **Social Features** | Athlete profiles, community challenges, shareable report cards |
| **Live Analysis** | Real-time in-app recording with instant pose feedback (on-device AI) |
| **Governing Body Tie-ups** | Direct integrations with SAI, state sports bodies, BCCI, AFI |
| **Multi-language Support** | Hindi and regional languages to reach deeper into underserved communities |
| **Wearable Integration** | Supplement video analysis with accelerometer/heart rate data from fitness bands |

---

## 19. Getting Started — Local Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.10+
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier at supabase.com)
- Cloudinary account (free tier at cloudinary.com)
- Android Studio (for emulator) or physical Android device with Expo Go installed

### 1. Clone the Repository

```bash
git clone https://github.com/your-team/athletix.git
cd athletix
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env — add your Supabase and Cloudinary keys

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
# Server starts at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 3. Frontend Setup

```bash
cd mobile-app

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env — add your API base URL and Supabase keys

# Start the Expo dev server
npx expo start

# Press 'a' to open on Android emulator
# Or scan QR code with Expo Go on your Android device
```

### 4. Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the table creation SQL from Section 10 in the Supabase SQL editor
3. Apply RLS policies per the policy table in Section 10.3
4. Enable Authentication with Email provider
5. Copy your project URL and anon key to `.env`

---

## 20. Environment Variables

### Backend `.env`

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# App
APP_ENV=development
SECRET_KEY=your-random-secret-for-internal-signing
```

### Frontend `.env`

```env
# API
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# Supabase (anon key only — never service role key in frontend)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Security:** The `SUPABASE_SERVICE_ROLE_KEY` is backend-only. Never expose it in the mobile app. The frontend uses only the `ANON_KEY`, which is safe to expose and is restricted by RLS.

---

## 21. Third-Party Services

| Service | Purpose | Tier | Free Limits |
|---------|---------|------|------------|
| **Supabase** | PostgreSQL DB + Auth + RLS | Free | 500MB DB, 50K monthly active users |
| **Cloudinary** | Video storage, auto-compression, CDN delivery | Free | 25GB storage, 25GB monthly bandwidth |
| **MediaPipe BlazePose** | Pretrained pose estimation (33 keypoints) | Free / Open-source | No limits — runs on your server |
| **Expo (EAS)** | Android/iOS build and deployment | Free | 15 builds/month |
| **Expo Push Notifications** | Mobile push notification delivery | Free | Generous free tier |

> All services operate within free tiers — **zero infrastructure cost** for the hackathon demo.

---

## 22. Team

**Team Name:** Billo's Crew
**Event:** Smart India Hackathon 2026
**Problem Area:** Fitness & Sports — Ministry of Youth Affairs and Sports

---

<div align="center">

**ATHLETIX** — *Because talent shouldn't be invisible.*

Built with love for Smart India Hackathon 2026 by **Billo's Crew**

*Empowering every athlete, from every corner of India, to be seen.*

</div>
