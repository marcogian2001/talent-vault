# Voxium AI — Technical Project Report

> **Report Date:** February 14, 2026  
> **Auditor:** AI Technical Auditor & Software Architect  
> **Scope:** Full codebase analysis — architecture, dependencies, data flow, security, infrastructure, and maintainability

---

## Table of Contents

1. [General Information](#1-general-information)
2. [Application Architecture](#2-application-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Dependencies and Libraries](#4-dependencies-and-libraries)
5. [State and Data Management](#5-state-and-data-management)
6. [Data Layer & APIs](#6-data-layer--apis)
7. [Authentication & Security](#7-authentication--security)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Performance & Optimization](#9-performance--optimization)
10. [Testing & Quality Assurance](#10-testing--quality-assurance)
11. [Design Patterns](#11-design-patterns)
12. [Configuration Analysis](#12-configuration-analysis)
13. [Maintainability & Scalability](#13-maintainability--scalability)
14. [Technical Risks](#14-technical-risks)
15. [Recommendations](#15-recommendations)

---

## 1. General Information

| Field                | Value                                                  |
|----------------------|--------------------------------------------------------|
| **Project name**     | Voxium AI (`voxium-ai`)                                |
| **Version**          | `0.1.0` (pre-release)                                  |
| **Application type** | AI-powered video meeting platform with post-call chat  |
| **Framework**        | Next.js `16.0.7`                                       |
| **React**            | `19.2.0`                                               |
| **TypeScript**       | `^5`                                                   |
| **Rendering mode**   | App Router — Server-Side Rendering (SSR) with Suspense streaming, client-side interactivity via `"use client"` boundaries |
| **Deployment model** | Vercel-oriented (no Docker/CI/CD configured)           |
| **Package manager**  | npm (`package-lock.json`)                              |
| **Repository**       | Git, single `main` branch                              |

### Application Description

Voxium AI is a web application that allows users to:

1. **Create AI Agents** — configurable assistants with custom instructions
2. **Schedule and conduct video meetings** — backed by Stream Video SDK with real-time OpenAI integration (voice AI agent participates live)
3. **Post-meeting review** — auto-generated transcript, recording, AI-powered summary, and a chat interface to ask questions about the completed meeting

```
┌─────────────────────────────────────────────────────────────┐
│                        Voxium AI                            │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────┐ │
│  │  Agents   │──▶│   Meetings   │──▶│   Live Video Call   │ │
│  │  (CRUD)   │   │  (CRUD/List) │   │  (Stream + OpenAI)  │ │
│  └──────────┘   └──────┬───────┘   └──────────┬──────────┘ │
│                        │                       │            │
│                        ▼                       ▼            │
│              ┌─────────────────┐   ┌───────────────────┐   │
│              │  Post-Meeting   │   │  Webhook Handler  │   │
│              │  Summary/Chat   │   │  (event dispatch) │   │
│              └─────────────────┘   └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Application Architecture

### 2.1 Architectural Pattern: Feature-Based Modular Architecture

The project follows a **feature-based (vertical slice) modular architecture** with a clear separation between:

- **Presentation layer** — React components (`ui/components/`, `ui/views/`)
- **Server logic layer** — tRPC procedures (`server/procedures.ts`)
- **Shared/domain layer** — schemas, types, constants (`schemas.ts`, `type.ts`, `params.ts`)

This is **not** a DDD or Clean Architecture implementation — it is a pragmatic modular split organized by business domain.

### 2.2 Module Organization

```
modules/
├── agents/          # AI Agent management (CRUD)
├── auth/            # Authentication views (sign-in/sign-up)
├── call/            # Live video call experience
├── dashboard/       # Shell: sidebar, navbar, command palette
├── home/            # Landing/home view (placeholder)
└── meetings/        # Meeting lifecycle (CRUD, status states, review)
```

Each domain module follows a consistent internal structure:

```
module/
├── hooks/              # Client-side hooks (filters, state)
├── server/
│   └── procedures.ts   # tRPC router definitions
├── ui/
│   ├── components/     # Presentational & container components
│   └── views/          # Page-level view compositions
├── params.ts           # URL search param parsers (nuqs)
├── schemas.ts          # Zod validation schemas
└── type.ts             # TypeScript type definitions
```

### 2.3 Separation of Concerns

| Layer              | Location                          | Responsibility                                    |
|--------------------|-----------------------------------|---------------------------------------------------|
| **Routing**        | `app/`                            | Next.js App Router, layouts, page wrappers        |
| **Views**          | `modules/*/ui/views/`             | Page-level component orchestration                |
| **Components**     | `modules/*/ui/components/`        | Feature-specific UI components                    |
| **Shared UI**      | `components/`                     | Cross-cutting reusable components                 |
| **Server Logic**   | `modules/*/server/procedures.ts`  | Business logic via tRPC procedures                |
| **Data Access**    | `db/`                             | Drizzle ORM schema and connection                 |
| **External SDKs**  | `lib/`                            | Stream Video/Chat, auth, avatars                  |
| **Type Safety**    | `trpc/`                           | End-to-end type-safe API infrastructure           |
| **Background Jobs**| `inngest/`                        | Asynchronous transcript processing                |

### 2.4 Module Dependency Graph

```
                    ┌──────────┐
                    │   app/   │  (routing layer)
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐  ┌──────────┐  ┌──────────┐
   │  modules/  │  │  trpc/   │  │   lib/   │
   │  agents    │  │  (init)  │  │  (SDKs)  │
   │  meetings  │  └────┬─────┘  └────┬─────┘
   │  call      │       │             │
   │  dashboard │       ▼             ▼
   │  auth      │  ┌─────────┐  ┌─────────┐
   └────┬───────┘  │   db/   │  │ inngest/ │
        │          │ (schema) │  │ (jobs)   │
        └──────────┴─────────┘  └──────────┘
```

---

## 3. Folder Structure

### 3.1 `/app` — Next.js App Router

| Path                              | Purpose                                                    |
|-----------------------------------|------------------------------------------------------------|
| `app/layout.tsx`                  | Root layout: `Inter` font, `TRPCReactProvider`, `NuqsAdapter`, `Toaster` |
| `app/globals.css`                 | Tailwind v4 theme + CSS variable design tokens             |
| `app/(auth)/`                     | Auth route group — centered card layout                    |
| `app/(auth)/sign-in/page.tsx`     | Sign-in page (redirects if authenticated)                  |
| `app/(auth)/sign-up/page.tsx`     | Sign-up page (redirects if authenticated)                  |
| `app/(dashboard)/`               | Dashboard route group — sidebar + navbar layout            |
| `app/(dashboard)/page.tsx`        | Home page (auth-gated)                                     |
| `app/(dashboard)/meetings/`       | Meetings list with server-side data prefetch               |
| `app/(dashboard)/meetings/[meetingId]/` | Meeting detail with suspense/error boundaries        |
| `app/(dashboard)/agents/`         | Agents list with server-side data prefetch                 |
| `app/(dashboard)/agents/[agentId]/` | Agent detail                                             |
| `app/call/`                       | Standalone call route (black background, no sidebar)       |
| `app/call/[meetingId]/page.tsx`   | Video call page                                            |
| `app/api/auth/[...all]/route.ts`  | Better Auth catch-all handler                              |
| `app/api/trpc/[trpc]/route.ts`    | tRPC HTTP handler                                          |
| `app/api/webhook/route.ts`        | Stream Video/Chat webhook processor (317 lines)            |
| `app/api/inngest/route.ts`        | Inngest function serving endpoint                          |

**Pattern:** All pages follow a consistent pattern:
1. Server Component page performs auth check → redirect if unauthenticated
2. Prefetches data via `queryClient.prefetchQuery(trpc.*.queryOptions(...))`
3. Wraps client view in `<HydrationBoundary>` + `<Suspense>` + `<ErrorBoundary>`

### 3.2 `/components`

| Path                           | Purpose                                                  |
|--------------------------------|----------------------------------------------------------|
| `components/ui/` (60+ files)  | shadcn/ui component library (New York style)             |
| `components/data-table.tsx`    | Generic data table using `@tanstack/react-table`         |
| `components/data-pagination.tsx`| Pagination controls for data tables                     |
| `components/command-select.tsx` | Command menu select (cmdk-based)                        |
| `components/empty-state.tsx`   | Reusable empty state illustration                        |
| `components/error-state.tsx`   | Reusable error state illustration                        |
| `components/loading-state.tsx` | Reusable loading state with spinner                      |
| `components/generated-avatar.tsx`| DiceBear avatar component wrapper                      |
| `components/responsive-dialog.tsx`| Dialog/drawer responsive wrapper (mobile ↔ desktop)   |

### 3.3 `/lib`

| File                | Purpose                                                        |
|---------------------|----------------------------------------------------------------|
| `lib/auth.ts`       | Better Auth server configuration (Google OAuth + email/password) |
| `lib/auth-client.ts`| Better Auth React client                                       |
| `lib/stream-video.ts`| Stream Video server client (singleton, `server-only`)         |
| `lib/stream-chat.ts`| Stream Chat server client + webhook hook auto-configuration    |
| `lib/avatar.tsx`    | DiceBear avatar URI generator (botttsNeutral, initials)        |
| `lib/utils.ts`      | `cn()` class merger + `formatDuration()` helper                |

### 3.4 `/hooks`

| File                    | Purpose                                           |
|-------------------------|---------------------------------------------------|
| `hooks/use-confirm.tsx` | Confirmation dialog hook (returns `[Component, confirmFn]`) |
| `hooks/use-mobile.ts`   | Mobile viewport detection hook                    |

### 3.5 `/db`

| File            | Purpose                                                    |
|-----------------|-------------------------------------------------------------|
| `db/index.ts`   | Drizzle ORM connection via `drizzle-orm/neon-http`          |
| `db/schema.ts`  | PostgreSQL schema: `user`, `session`, `account`, `verification`, `agents`, `meetings` |

### 3.6 `/trpc`

| File                  | Purpose                                                     |
|-----------------------|-------------------------------------------------------------|
| `trpc/init.ts`        | tRPC initialization, `baseProcedure`, `protectedProcedure`  |
| `trpc/client.tsx`     | Client-side tRPC provider with TanStack Query               |
| `trpc/server.tsx`     | Server-side tRPC proxy for data prefetching                 |
| `trpc/query-client.ts`| QueryClient factory with 30s stale time                    |
| `trpc/routers/_app.ts`| Root router combining `agents` + `meetings` routers        |

### 3.7 `/inngest`

| File               | Purpose                                                     |
|--------------------|-------------------------------------------------------------|
| `inngest/client.ts`| Inngest client initialization                               |
| `inngest/functions.ts`| `meetingsProcessing` function (transcript → summary via GPT-4o-mini) |

### 3.8 `/public`

| File                    | Purpose                                         |
|-------------------------|--------------------------------------------------|
| `public/logo.svg`       | Application logo                                |
| `public/empty.svg`      | Empty state illustration                        |
| `public/upcoming.svg`   | Upcoming meeting illustration                   |
| `public/processing.svg` | Processing state illustration                   |
| `public/cancelled.svg`  | Cancelled state illustration                    |
| `public/system-prompt.txt` | Meeting summarization prompt template         |
| `public/chat-instructions.txt` | Post-meeting chat instructions template   |

---

## 4. Dependencies and Libraries

### 4.1 Core Frameworks

| Dependency           | Version    | Purpose                                         | Impact |
|----------------------|------------|--------------------------------------------------|--------|
| `next`               | `16.0.7`   | Full-stack React framework (App Router)          | **Critical** — application foundation |
| `react` / `react-dom`| `19.2.0`   | UI rendering library                             | **Critical** — React 19 with concurrent features |
| `typescript`         | `^5`       | Type safety                                      | **High** — strict mode enabled |

### 4.2 Data Layer

| Dependency                  | Version   | Purpose                                        | Impact |
|-----------------------------|-----------|--------------------------------------------------|--------|
| `drizzle-orm`               | `^0.45.0` | Type-safe ORM for PostgreSQL                    | **Critical** — all database operations |
| `drizzle-kit`               | `^0.31.8` | Schema management and studio (dev)              | **Medium** — development tooling |
| `@neondatabase/serverless`  | `^1.0.2`  | Neon PostgreSQL serverless driver               | **Critical** — database connectivity |
| `@trpc/client` + `@trpc/server` | `^11.8.1` | End-to-end type-safe API layer              | **Critical** — all client-server communication |
| `@tanstack/react-query`     | `^5.90.12`| Server state management + caching              | **Critical** — data fetching, caching, hydration |
| `@tanstack/react-table`     | `^8.21.3` | Headless table library                          | **Medium** — agents/meetings list views |
| `zod`                       | `^4.2.1`  | Schema validation                               | **High** — input validation across tRPC + forms |

### 4.3 UI Libraries

| Dependency                     | Version   | Purpose                                   | Impact |
|--------------------------------|-----------|---------------------------------------------|--------|
| `tailwindcss`                  | `^4`      | Utility-first CSS framework (v4, CSS-based config) | **Critical** — all styling |
| `@tailwindcss/postcss`         | `^4`      | PostCSS integration for Tailwind v4        | **Critical** — build pipeline |
| `tw-animate-css`               | `^1.4.0`  | Animation utilities for Tailwind           | **Low** — entrance/exit animations |
| `class-variance-authority`     | `^0.7.1`  | Component variant management               | **Medium** — component styling API |
| `clsx` + `tailwind-merge`      | Latest    | Conditional class merging                  | **Medium** — `cn()` utility |
| `lucide-react`                 | `^0.556.0`| Icon library                               | **Medium** — all UI icons |
| `react-icons`                  | `^5.5.0`  | Additional icon library                    | **Low** — appears underutilized |
| Radix UI primitives (18+ pkgs) | Various   | Accessible headless UI components          | **High** — foundation for shadcn/ui |
| `radix-ui`                     | `^1.4.3`  | Radix UI unified package                   | **Medium** — newer unified API |
| `cmdk`                         | `^1.1.1`  | Command palette                            | **Low** — dashboard command menu |
| `sonner`                       | `^2.0.7`  | Toast notifications                        | **Medium** — user feedback |
| `vaul`                         | `^1.1.2`  | Drawer component                           | **Low** — mobile responsive dialogs |
| `embla-carousel-react`         | `^8.6.0`  | Carousel                                   | **Low** — shadcn/ui dependency |
| `react-resizable-panels`       | `^3.0.6`  | Resizable panel layouts                    | **Low** — shadcn/ui dependency |
| `recharts`                     | `^2.15.4` | Charting library                           | **Low** — shadcn/ui dependency |
| `react-day-picker`             | `^9.12.0` | Date picker                                | **Low** — shadcn/ui dependency |
| `input-otp`                    | `^1.4.2`  | OTP input                                  | **Low** — shadcn/ui dependency |
| `react-markdown`               | `^10.1.0` | Markdown renderer                          | **Medium** — meeting summary display |
| `react-highlight-words`        | `^0.21.0` | Text highlighting                          | **Low** — transcript search highlighting |
| `react-hook-form`              | `^7.68.0` | Form management                            | **Medium** — agent/meeting forms |
| `@hookform/resolvers`          | `^5.2.2`  | Zod resolver for react-hook-form           | **Medium** — validation integration |
| `next-themes`                  | `^0.4.6`  | Theme switching                            | **Low** — dark mode support (not actively wired) |
| `react-error-boundary`         | `^6.0.0`  | Error boundary components                  | **Medium** — page-level error handling |

### 4.4 External Service SDKs

| Dependency                         | Version   | Purpose                                    | Impact |
|------------------------------------|-----------|--------------------------------------------|--------|
| `@stream-io/video-react-sdk`      | `^1.32.1` | Stream Video — client-side calling UI      | **Critical** — video call experience |
| `@stream-io/node-sdk`             | `^0.7.40` | Stream Video — server-side operations      | **Critical** — call creation, tokens, webhooks |
| `@stream-io/openai-realtime-api`  | `^0.3.3`  | Stream ↔ OpenAI Realtime bridge            | **Critical** — live AI voice in calls |
| `stream-chat`                      | `^9.32.0` | Stream Chat — JS client                    | **High** — post-meeting chat |
| `stream-chat-react`                | `^13.13.6`| Stream Chat — React components             | **High** — chat UI |
| `openai`                           | `^6.21.0` | OpenAI GPT API client                      | **High** — post-meeting Q&A responses |
| `inngest`                          | `^3.52.0` | Background job orchestration               | **High** — async transcript processing |
| `@inngest/agent-kit`              | `^0.13.2` | Agent framework for Inngest                | **High** — summarization agent |

### 4.5 Utilities

| Dependency             | Version   | Purpose                                  | Impact |
|------------------------|-----------|-------------------------------------------|--------|
| `nanoid`               | `^5.1.6`  | ID generation for DB records             | **Medium** — primary key generation |
| `date-fns`             | `^4.1.0`  | Date formatting                          | **Low** — display formatting |
| `humanize-duration`    | `^3.33.2` | Duration formatting                      | **Low** — meeting duration display |
| `nuqs`                 | `^2.8.6`  | URL search params state management       | **Medium** — filter state in URL |
| `jsonl-parse-stringify` | `^1.0.3` | JSONL parser                             | **Medium** — transcript parsing |
| `@dicebear/core` + `@dicebear/collection` | `^9.2.4` | Avatar generation     | **Low** — user/agent avatars |
| `dotenv`               | `^17.2.3` | Environment variable loading             | **Low** — drizzle config |
| `server-only` / `client-only` | `^0.0.1` | Import guards for RSC boundaries  | **Medium** — prevents accidental cross-boundary imports |

### 4.6 Missing Categories

| Category               | Status                                   |
|------------------------|-------------------------------------------|
| **Testing frameworks** | **None** — no Jest, Vitest, Playwright, or Cypress |
| **Monitoring/logging** | **None** — no Sentry, DataDog, or structured logging |
| **Analytics**          | **None** — no Vercel Analytics, PostHog, or Mixpanel |
| **Prettier**           | **Not configured** — no `.prettierrc` found |
| **Babel**              | **Not applicable** — Next.js uses SWC      |

---

## 5. State and Data Management

### 5.1 State Management Strategy

The application follows a **server-state-first** approach with **no global client state store** (no Redux, Zustand, or Jotai).

```
┌──────────────────────────────────────────────────────────┐
│                    State Architecture                     │
│                                                          │
│  Server State (TanStack Query via tRPC)                  │
│  ├── Meetings data (list, detail, transcript)            │
│  ├── Agents data (list, detail)                          │
│  └── Token generation (Stream Video/Chat)                │
│                                                          │
│  URL State (nuqs)                                        │
│  ├── Search filters                                      │
│  ├── Pagination                                          │
│  ├── Status filter                                       │
│  └── Agent ID filter                                     │
│                                                          │
│  Local Component State (useState)                        │
│  ├── Dialog open/close                                   │
│  ├── Call state (lobby/call/ended)                       │
│  └── Stream Video/Chat client instances                  │
│                                                          │
│  External SDK State                                      │
│  ├── StreamVideoClient (managed by useEffect)            │
│  └── StreamChat client (managed by provider)             │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Caching Strategy

- **TanStack Query** `staleTime: 30_000` (30 seconds) — data considered fresh for 30s
- **Server-side prefetching** with `HydrationBoundary` — prevents waterfalls on initial page load
- **Dehydration/hydration** — server-prefetched data is serialized and passed to client
- **Optimistic invalidation** via `queryClient.invalidateQueries()` on mutations

### 5.3 Data Synchronization

- **No real-time data sync** (no WebSocket/SSE for data updates)
- **Webhook-driven** updates for meeting lifecycle (Stream → webhook → DB update)
- **30s stale polling** implicit via TanStack Query on refocus/reconnect

### 5.4 URL State Management

Both `agents` and `meetings` modules use `nuqs` for type-safe URL search parameter management:

```typescript
// modules/meetings/params.ts
export const filtersSearchParams = {
  search: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(DEFAULT_PAGE),
  status: parseAsStringEnum(Object.values(MeetingStatus)),
  agentId: parseAsString.withDefault(""),
};
```

This ensures filter state is shareable via URL and survives page refreshes.

---

## 6. Data Layer & APIs

### 6.1 Database Architecture

**Provider:** Neon PostgreSQL (serverless)  
**ORM:** Drizzle ORM with `neon-http` driver  
**Schema management:** `drizzle-kit push` (direct schema push, no migration files)

#### Entity-Relationship Diagram

```
┌──────────────┐      ┌──────────────┐      ┌────────────────┐
│    user       │      │   session    │      │    account     │
├──────────────┤      ├──────────────┤      ├────────────────┤
│ id (PK)      │◄─┐   │ id (PK)      │      │ id (PK)        │
│ name         │  │   │ expiresAt    │      │ accountId      │
│ email (UQ)   │  ├──▶│ userId (FK)  │      │ providerId     │
│ emailVerified│  │   │ token (UQ)   │  ┌──▶│ userId (FK)    │
│ image        │  │   │ ipAddress    │  │   │ accessToken    │
│ createdAt    │  │   │ userAgent    │  │   │ refreshToken   │
│ updatedAt    │  │   └──────────────┘  │   │ password       │
└──────────────┘  │                      │   └────────────────┘
       │          └──────────────────────┘
       │
       │   ┌──────────────┐      ┌──────────────────┐
       │   │   agents     │      │    meetings       │
       │   ├──────────────┤      ├──────────────────┤
       │   │ id (PK)      │◄────▶│ id (PK)           │
       └──▶│ userId (FK)  │      │ userId (FK) ──────┘
           │ name         │      │ agentId (FK) ─────┘
           │ instructions │      │ name              │
           │ createdAt    │      │ status (enum)     │
           │ updatedAt    │      │ startedAt         │
           └──────────────┘      │ endedAt           │
                                 │ transcriptUtl     │
                                 │ recordingUrl      │
                                 │ summary           │
                                 │ createdAt         │
                                 │ updatedAt         │
                                 └──────────────────┘

meeting_status ENUM: upcoming | active | completed | processing | cancelled
```

**Note:** The column `transcriptUtl` appears to be a typo for `transcriptUrl`.

### 6.2 tRPC API Layer

The application uses tRPC v11 as its primary API layer — there are **no REST endpoints** for business logic. The only raw API routes serve external integrations.

#### Agents Router (`modules/agents/server/procedures.ts`)

| Procedure        | Type     | Auth   | Description                  |
|------------------|----------|--------|------------------------------|
| `agents.create`  | Mutation | Yes    | Create new agent             |
| `agents.update`  | Mutation | Yes    | Update agent (owner check)   |
| `agents.remove`  | Mutation | Yes    | Delete agent (owner check)   |
| `agents.getOne`  | Query    | Yes    | Get single agent by ID       |
| `agents.getMany` | Query    | Yes    | Paginated agent list + search|

#### Meetings Router (`modules/meetings/server/procedures.ts`)

| Procedure                    | Type     | Auth   | Description                       |
|------------------------------|----------|--------|-----------------------------------|
| `meetings.create`            | Mutation | Yes    | Create meeting + Stream Video call|
| `meetings.update`            | Mutation | Yes    | Update meeting (owner check)      |
| `meetings.remove`            | Mutation | Yes    | Delete meeting (owner check)      |
| `meetings.getOne`            | Query    | Yes    | Get meeting with agent + duration |
| `meetings.getMany`           | Query    | Yes    | Paginated list with filters       |
| `meetings.getTranscript`     | Query    | Yes    | Fetch + parse JSONL transcript    |
| `meetings.generateToken`     | Mutation | Yes    | Generate Stream Video user token  |
| `meetings.generateChatToken` | Mutation | Yes    | Generate Stream Chat user token   |

### 6.3 Webhook Route (`app/api/webhook/route.ts`)

The webhook route is a **317-line monolithic handler** that processes events from both Stream Video and Stream Chat:

| Event Type                          | Action                                                        |
|-------------------------------------|---------------------------------------------------------------|
| `call.session_started`              | Mark meeting "active", connect OpenAI Realtime to call        |
| `call.session_participant_left`     | End the call                                                  |
| `call.session_ended`                | Mark meeting "processing"                                     |
| `call.transcription_ready`          | Save transcript URL, dispatch Inngest processing job          |
| `call.recording_ready`             | Save recording URL                                            |
| `message.new`                       | Generate GPT-4o response for post-meeting chat                |

**Signature Verification:** Dual verification — tries Stream Video SDK first, falls back to Stream Chat SDK.

### 6.4 Inngest Background Processing

The `meetingsProcessing` function orchestrates transcript summarization:

```
Transcript URL → Fetch JSONL → Parse → Resolve speaker names → GPT-4o-mini summary → Save to DB
```

Steps:
1. `fetch-transcript` — Download raw JSONL transcript
2. `parse-transcript` — Parse JSONL to structured items
3. `add-speakers` — Resolve speaker IDs to user/agent names
4. Summarize via `@inngest/agent-kit` with GPT-4o-mini
5. `save-summary` — Update meeting record with summary, set status to "completed"

### 6.5 Input Validation

- **tRPC inputs:** Validated with Zod schemas
- **Webhook inputs:** Manual validation (signature check + field existence checks)
- **Form inputs:** Zod schemas via `@hookform/resolvers`

### 6.6 Error Handling

- **tRPC:** `TRPCError` with standard codes (`NOT_FOUND`, `UNAUTHORIZED`)
- **Client:** `react-error-boundary` `<ErrorBoundary>` at page level
- **Webhook:** Returns `NextResponse.json()` with HTTP status codes
- **No global error tracking** — errors are only logged to console

---

## 7. Authentication & Security

### 7.1 Authentication System

**Library:** Better Auth (`better-auth@^1.4.5`)

| Method              | Configuration                              |
|---------------------|---------------------------------------------|
| Email + Password    | Enabled (built-in)                          |
| Google OAuth        | Configured via `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` |

### 7.2 Session Management

Better Auth manages sessions via the `session` table in PostgreSQL:

```typescript
// db/schema.ts
session: {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}
```

- **Session retrieval:** `auth.api.getSession({ headers: await headers() })` on every protected page
- **Client-side:** `authClient.useSession()` React hook

### 7.3 Route Protection

| Layer        | Method                                           | Coverage                |
|-------------|--------------------------------------------------|-------------------------|
| **Pages**   | Manual `getSession()` + `redirect("/sign-in")`  | Each page individually  |
| **tRPC**    | `protectedProcedure` middleware                  | All business endpoints  |
| **Webhook** | Signature verification (`x-signature` header)    | Webhook route only      |
| **Middleware** | **None** — no Next.js middleware for auth      | Gap                     |

### 7.4 Security Assessment

| Aspect                | Status    | Details                                                     |
|-----------------------|-----------|-------------------------------------------------------------|
| **Webhook signatures**| Implemented | Dual SDK verification (Stream Video + Chat)              |
| **CORS**              | Default   | Next.js defaults (no custom configuration)                 |
| **Rate limiting**     | **Missing** | No rate limiting on any endpoint                          |
| **Input sanitization**| Partial   | Zod validation on tRPC; manual on webhook                  |
| **SQL injection**     | Protected | Drizzle ORM parameterized queries                          |
| **Secrets management**| Environment | `.env` file, no secrets in code                          |
| **CSRF protection**   | Better Auth | Built-in CSRF handling                                  |
| **Middleware auth**    | **Missing** | No Next.js middleware for route protection              |
| **API key exposure**  | Risk     | `NEXT_PUBLIC_STREAM_*` keys exposed to client (expected for Stream) |
| **`.env` in repo**    | Risk     | `.env` exists but `.gitignore` blocks `*.env*`             |

### 7.5 Secrets Inventory

| Variable                           | Type          | Exposure          |
|------------------------------------|---------------|-------------------|
| `DATABASE_URL`                     | Server-only   | Server            |
| `BETTER_AUTH_SECRET`               | Server-only   | Server            |
| `BETTER_AUTH_URL`                  | Server-only   | Server            |
| `GOOGLE_CLIENT_ID`                 | Server-only   | Server            |
| `GOOGLE_CLIENT_SECRET`             | Server-only   | Server            |
| `NEXT_PUBLIC_APP_URL`              | Public        | Client + Server   |
| `NEXT_PUBLIC_STREAM_VIDEO_API_KEY` | Public        | Client + Server   |
| `STREAM_VIDEO_SECRET_KEY`          | Server-only   | Server            |
| `NEXT_PUBLIC_STREAM_CHAT_API_KEY`  | Public        | Client + Server   |
| `STREAM_CHAT_SECRET_KEY`           | Server-only   | Server            |
| `OPEN_AI_KEY`                      | Server-only   | Server            |

---

## 8. Infrastructure & Deployment

### 8.1 Hosting

| Aspect          | Status                                              |
|-----------------|------------------------------------------------------|
| **Provider**    | Vercel (inferred from `.vercel` in `.gitignore`, default Next.js deployment) |
| **Database**    | Neon PostgreSQL (serverless)                         |
| **CDN**         | Vercel Edge Network (default)                        |
| **DNS**         | Not configured in repo                               |

### 8.2 CI/CD

| Aspect                  | Status                         |
|-------------------------|--------------------------------|
| **GitHub Actions**      | **None** — no `.github/` dir  |
| **Pre-commit hooks**    | **None** — no Husky/lint-staged |
| **Automated testing**   | **None**                       |
| **Automated deployment**| Likely Vercel Git integration  |

### 8.3 Build Process

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio",
  "dev:webhook": "ngrok http --url=nondisjunctively-unswitched-muoi.ngrok-free.dev 3000"
}
```

**Note:** The `dev:webhook` script exposes a hardcoded ngrok URL — this is a development convenience for webhook testing.

### 8.4 Environment Configuration

- **No `.env.example`** — new developers must discover required variables manually
- **No environment validation** — application will crash at runtime with missing variables (non-null assertions `!` everywhere)
- **No staging/production separation** — single `.env` file

---

## 9. Performance & Optimization

### 9.1 Implemented Optimizations

| Technique                   | Implementation                                        |
|-----------------------------|-------------------------------------------------------|
| **Server-side prefetching** | `queryClient.prefetchQuery()` in server components    |
| **Data hydration**          | `<HydrationBoundary>` prevents client re-fetch        |
| **Streaming SSR**           | `<Suspense>` boundaries for progressive rendering     |
| **Font optimization**       | `next/font/google` for Inter font                     |
| **Image component**         | `next/image` used for logo                            |
| **Code splitting**          | Automatic via Next.js route-based splitting            |
| **Stale-while-revalidate**  | TanStack Query 30s stale time                         |

### 9.2 Missing Optimizations

| Technique               | Status                                                |
|--------------------------|-------------------------------------------------------|
| **Dynamic imports**      | Not used — all components statically imported          |
| **`React.lazy()`**       | Not used                                              |
| **Bundle analysis**      | Not configured (no `@next/bundle-analyzer`)            |
| **Image optimization**   | Minimal — only logo uses `next/image`; video recording served raw |
| **Edge functions**       | Not utilized (all serverless, no `runtime = 'edge'`)   |
| **ISR / Static generation** | Not used — all pages are fully dynamic SSR          |
| **Middleware caching**   | No middleware exists                                   |
| **Database connection pooling** | Neon serverless handles this implicitly            |

### 9.3 Performance Concerns

1. **Webhook route cold starts** — The webhook initializes OpenAI client, Stream Video, and Stream Chat on every invocation (module-level singletons mitigate this partially)
2. **In-memory deduplication** — `processedMessageIds` Set in webhook route will not persist across serverless invocations (see Section 14)
3. **Avatar generation** — `generateAvatarUri()` is called synchronously inline; DiceBear generates SVGs server-side on every request without caching
4. **Transcript fetch** — `getTranscript` tRPC procedure fetches the full transcript from Stream CDN on every call without server-side caching

---

## 10. Testing & Quality Assurance

### 10.1 Testing Status

| Category         | Status                       |
|------------------|------------------------------|
| Unit tests       | **None**                     |
| Integration tests| **None**                     |
| E2E tests        | **None**                     |
| API tests        | **None**                     |
| Coverage tools   | **None**                     |
| Test runner      | **Not configured**           |

### 10.2 Static Analysis

| Tool          | Status      | Configuration                                |
|---------------|-------------|----------------------------------------------|
| TypeScript    | **Strict**  | `strict: true` in `tsconfig.json`            |
| ESLint        | Configured  | `eslint-config-next` (core-web-vitals + TypeScript) |
| Prettier      | **Missing** | No configuration found                       |

### 10.3 Code Quality Assessment

- **TypeScript strict mode** provides good compile-time safety
- **Zod validation** at API boundaries adds runtime safety
- **No Prettier** means inconsistent formatting is possible
- **No pre-commit hooks** means linting is not enforced before commits
- **No test coverage gate** for deployments

---

## 11. Design Patterns

### 11.1 Provider Pattern

Used extensively for context injection:

```typescript
// app/layout.tsx — Root providers
<NuqsAdapter>
  <TRPCReactProvider>
    <html>
      <body>
        <Toaster />
        {children}
      </body>
    </html>
  </TRPCReactProvider>
</NuqsAdapter>
```

```typescript
// modules/call/ui/components/call-connect.tsx — Stream Video provider
<StreamVideo client={client}>
  <StreamCall call={call}>
    <CallUI meetingName={meetingName} />
  </StreamCall>
</StreamVideo>
```

### 11.2 Container/View Pattern (Server/Client Split)

Server Components act as containers that prefetch data and pass it to client views:

```typescript
// app/(dashboard)/meetings/[meetingId]/page.tsx (Server Component)
const Page = async ({ params }: Props) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.meetings.getOne.queryOptions({ id: meetingId }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<MeetingIdViewLoading />}>
        <ErrorBoundary fallback={<MeetingIdViewError />}>
          <MeetingIdView meetingId={meetingId} />  {/* Client Component */}
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};
```

### 11.3 Hooks Pattern (Custom Hooks)

```typescript
// hooks/use-confirm.tsx — Returns [Component, confirmFn] tuple
const [RemoveConfirmation, confirmRemove] = useConfirm(
  "Are you sure?",
  "This action will remove this meeting",
);
```

```typescript
// modules/meetings/hooks/use-meetings-filters.ts
// Uses nuqs for URL-synchronized filter state
const { search, page, status, agentId } = useMeetingsFilters();
```

### 11.4 Factory Pattern (Avatar Generation)

```typescript
// lib/avatar.tsx
export const generateAvatarUri = ({ seed, variant }: Props) => {
  let avatar;
  if (variant === "botttsNeutral") {
    avatar = createAvatar(botttsNeutral, { seed });
  } else {
    avatar = createAvatar(initials, { seed, fontWeight: 500, fontSize: 42 });
  }
  return avatar.toDataUri();
};
```

### 11.5 Singleton Pattern (SDK Clients)

```typescript
// lib/stream-video.ts
import "server-only";
export const streamVideo = new StreamClient(
  process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
  process.env.STREAM_VIDEO_SECRET_KEY!,
);
```

```typescript
// lib/stream-chat.ts
import "server-only";
export const streamChat = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
  process.env.STREAM_CHAT_SECRET_KEY!,
);
```

### 11.6 Protected Procedure Middleware (Decorator Pattern)

```typescript
// trpc/init.ts
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }
  return next({ ctx: { ...ctx, auth: session } });
});
```

### 11.7 State Machine Pattern (Meeting Status)

The meeting entity follows an implicit state machine:

```
upcoming ──▶ active ──▶ processing ──▶ completed
    │                                       
    └──────────▶ cancelled                  
```

Transitions are driven by webhook events, not by a formal state machine library.

### 11.8 Compound Component Pattern (shadcn/ui)

```typescript
// Sidebar compound component usage
<Sidebar>
  <SidebarHeader>...</SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>...</SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
  <SidebarFooter>...</SidebarFooter>
</Sidebar>
```

---

## 12. Configuration Analysis

### 12.1 `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

**Analysis:** Completely empty. No custom configuration for:
- Image domains (could cause issues with external images)
- Webpack/Turbopack customization
- Redirects/rewrites
- Headers (security headers)
- Experimental features
- Output mode

**Impact:** All Next.js defaults apply. Missing security headers (`X-Frame-Options`, `Content-Security-Policy`, etc.).

### 12.2 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "incremental": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

**Analysis:** Well-configured for Next.js 16:
- `strict: true` — excellent for type safety
- `bundler` module resolution — correct for modern bundlers
- `@/*` path alias — clean imports
- `incremental: true` — faster rebuilds

### 12.3 `eslint.config.mjs`

Uses the flat config format with:
- `eslint-config-next/core-web-vitals` — Next.js best practices
- `eslint-config-next/typescript` — TypeScript rules

**Analysis:** Minimal but adequate. No custom rules configured. Missing:
- Import sorting rules
- Unused variable strictness
- Consistent return types

### 12.4 `drizzle.config.ts`

```typescript
export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

**Analysis:** Standard configuration. Uses `push` mode (no migration files generated). This is acceptable for early development but should transition to migration-based workflows before production.

### 12.5 Environment Variables

**Analysis:**
- No validation at startup (e.g., `zod` env schema)
- Non-null assertions (`!`) used everywhere — will cause unclear runtime crashes
- No `.env.example` file for documentation
- `OPEN_AI_KEY` naming convention is inconsistent (should be `OPENAI_API_KEY` per convention)

---

## 13. Maintainability & Scalability

### 13.1 System Complexity Assessment

| Aspect                    | Rating        | Rationale                                          |
|---------------------------|---------------|-----------------------------------------------------|
| **Codebase size**         | Small-Medium  | ~100 application files, well-scoped                 |
| **Module coupling**       | Low-Medium    | Modules are independent; shared via `db/`, `lib/`   |
| **Code readability**      | Good          | Consistent patterns, clear naming                   |
| **Type safety**           | Strong        | End-to-end types via tRPC + Zod + Drizzle           |
| **Onboarding difficulty** | Medium        | No docs, but patterns are discoverable              |

### 13.2 Technical Debt

| Item                                          | Severity | Location                           |
|-----------------------------------------------|----------|------------------------------------|
| No tests whatsoever                           | **High** | Entire codebase                    |
| Hardcoded `meetingCount: 5` in agents query   | **Medium** | `agents/server/procedures.ts:65,95` |
| Typo: `transcriptUtl` instead of `transcriptUrl` | **Low** | `db/schema.ts`, webhook, procedures |
| Typo: filename `contants.ts` vs `constants.ts` | **Low** | `modules/contants.ts`              |
| `processedMessageIds` in-memory Set           | **Medium** | `app/api/webhook/route.ts:25`      |
| Hardcoded ngrok URL in scripts                | **Low** | `package.json:dev:webhook`         |
| `throw NextResponse.json()` (throws response) | **Medium** | `webhook/route.ts:184,199`        |
| No `.env.example`                             | **Low** | Root directory                     |
| Inconsistent auth checks (some pages missing) | **Medium** | `agents/[agentId]/page.tsx`       |

### 13.3 Strengths

1. **Clean modular architecture** — Feature-based modules with consistent internal structure
2. **End-to-end type safety** — tRPC + Zod + Drizzle eliminates entire classes of bugs
3. **Modern stack** — Next.js 16, React 19, Tailwind v4, Drizzle ORM
4. **Proper SSR patterns** — Server-side prefetch + hydration + suspense boundaries
5. **Consistent UI** — shadcn/ui provides a cohesive design system
6. **Authorization scoping** — All database queries filter by `userId`

### 13.4 Bottlenecks

1. **Webhook handler** — 317-line monolithic function handling 6 event types; will become harder to maintain
2. **No real-time data updates** — Dashboard requires refresh to see meeting status changes
3. **Single API route for all webhooks** — Stream Video and Stream Chat share one endpoint
4. **No database migrations** — `drizzle-kit push` is not suitable for production schema evolution

### 13.5 Extensibility

| Dimension                | Ease     | Notes                                        |
|--------------------------|----------|----------------------------------------------|
| Adding new modules       | **Easy** | Clear module pattern to follow               |
| Adding new tRPC routes   | **Easy** | Router composition pattern                   |
| Adding new webhook events| **Medium**| Monolithic handler needs refactoring first   |
| Multi-tenancy            | **Hard** | User scoping exists but no org/team concept  |
| Internationalization     | **Hard** | No i18n infrastructure                       |
| Payment integration      | **Medium**| "Upgrade" link exists but no implementation  |

---

## 14. Technical Risks

### 14.1 Critical Risks

| Risk                                           | Impact  | Likelihood | Mitigation                              |
|------------------------------------------------|---------|------------|------------------------------------------|
| **No tests** — regressions undetected          | High    | High       | Implement test suite (see Section 15)    |
| **In-memory dedup Set** — fails in serverless  | High    | High       | Use Redis or idempotency keys in DB      |
| **No rate limiting** — webhook/API abuse       | High    | Medium     | Add rate limiting middleware             |
| **No error tracking** — production issues invisible | High | High    | Add Sentry or similar                    |

### 14.2 Medium Risks

| Risk                                           | Impact  | Likelihood | Mitigation                              |
|------------------------------------------------|---------|------------|------------------------------------------|
| **Schema push** — data loss on migration       | Medium  | Medium     | Switch to migration-based Drizzle workflow |
| **Hardcoded `meetingCount: 5`**                | Low     | Certain    | Replace with actual count subquery       |
| **`throw NextResponse.json()`**                | Medium  | Low        | Use `return` instead of `throw`          |
| **No env validation**                          | Medium  | Medium     | Add Zod env schema                       |
| **No middleware auth**                         | Medium  | Low        | Add Next.js middleware for route protection |

### 14.3 Anti-Patterns Identified

1. **Throwing responses** — `throw NextResponse.json(...)` in webhook route (lines 184, 199) — this throws a Response object as an error, which is semantically wrong. Should use `return`.

2. **Hardcoded mock data** — `meetingCount: sql<number>\`5\`` returns literal `5` for all agents, not actual meeting counts.

3. **Inline SDK initialization with side effects** — `lib/stream-chat.ts` performs async webhook configuration at module import time, which runs on every cold start.

4. **Duplicate icon libraries** — Both `lucide-react` and `react-icons` are installed; only `lucide-react` is used throughout the codebase.

5. **Public directory for prompts** — `system-prompt.txt` and `chat-instructions.txt` in `/public` are publicly accessible at `https://domain.com/system-prompt.txt`. These should be in server-only code.

### 14.4 Code Smells

1. **Unused import** — `not` imported from `drizzle-orm` in webhook route but never used
2. **Inconsistent variable naming** — `GPTResponse`, `GPTResponseText` (PascalCase for variables)
3. **Magic numbers** — `.slice(-5)` for previous messages count in webhook
4. **Typos in user-facing strings** — "followuin" (should be "following"), "Missign" (should be "Missing")

---

## 15. Recommendations

### 15.1 Priority 1 — Critical (Immediate)

| # | Recommendation                                | Effort | Impact |
|---|-----------------------------------------------|--------|--------|
| 1 | **Add error tracking (Sentry)** — Production errors are currently invisible | Low    | High   |
| 2 | **Fix in-memory deduplication** — Replace `processedMessageIds` Set with Redis or database-level idempotency (the Set resets on every serverless cold start) | Medium | High   |
| 3 | **Move prompt files out of `/public`** — `system-prompt.txt` and `chat-instructions.txt` are publicly accessible; move to `lib/` or inline in code | Low    | High   |
| 4 | **Add environment validation** — Use `@t3-oss/env-nextjs` or Zod schema to validate env vars at build/startup time | Low    | Medium |
| 5 | **Fix `throw NextResponse.json()`** — Replace with `return NextResponse.json()` in webhook route (lines 184, 199) | Low    | Medium |

### 15.2 Priority 2 — High (Within 2 weeks)

| # | Recommendation                                | Effort | Impact |
|---|-----------------------------------------------|--------|--------|
| 6 | **Add Next.js middleware** for auth — Centralize route protection instead of manual `getSession()` on every page | Medium | High   |
| 7 | **Add rate limiting** — Protect webhook and auth endpoints (use `@upstash/ratelimit` or similar) | Medium | High   |
| 8 | **Set up testing infrastructure** — Start with Vitest for unit tests on tRPC procedures + Playwright for critical E2E flows | High   | High   |
| 9 | **Refactor webhook handler** — Split into per-event-type handlers; extract to a service layer | Medium | Medium |
| 10| **Fix hardcoded `meetingCount: 5`** — Replace with actual aggregate subquery | Low    | Medium |
| 11| **Create `.env.example`** — Document all required environment variables | Low    | Medium |

### 15.3 Priority 3 — Medium (Within 1 month)

| # | Recommendation                                | Effort | Impact |
|---|-----------------------------------------------|--------|--------|
| 12| **Switch to Drizzle migrations** — Replace `drizzle-kit push` with `drizzle-kit generate` + `drizzle-kit migrate` for production-safe schema evolution | Medium | High   |
| 13| **Add security headers** in `next.config.ts` — `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`, `Referrer-Policy` | Low    | Medium |
| 14| **Configure Prettier** — Add `.prettierrc` + integrate with ESLint | Low    | Medium |
| 15| **Add CI/CD pipeline** — GitHub Actions for lint, type-check, test, and deploy | Medium | High   |
| 16| **Add pre-commit hooks** — Husky + lint-staged for consistent code quality | Low    | Medium |
| 17| **Remove unused dependencies** — `react-icons` (only `lucide-react` is used) | Low    | Low    |
| 18| **Fix typos** — `transcriptUtl` → `transcriptUrl`, `contants.ts` → `constants.ts`, "followuin" → "following", "Missign" → "Missing" | Low    | Low    |

### 15.4 Priority 4 — Low (Backlog)

| # | Recommendation                                | Effort | Impact |
|---|-----------------------------------------------|--------|--------|
| 19| **Add real-time updates** — Use TanStack Query's `refetchInterval` or WebSocket subscriptions for meeting status changes | Medium | Medium |
| 20| **Add analytics** — Vercel Analytics or PostHog for usage tracking | Low    | Medium |
| 21| **Implement the "Upgrade" flow** — Currently a dead link in sidebar | High   | Medium |
| 22| **Add dark mode toggle** — `next-themes` is installed but not wired up | Low    | Low    |
| 23| **Bundle analysis** — Add `@next/bundle-analyzer` to monitor bundle size | Low    | Low    |
| 24| **Optimize avatar generation** — Cache generated avatar URIs (they're deterministic based on seed) | Low    | Low    |

### 15.5 Refactoring Roadmap

```
Phase 1 (Week 1-2): Security & Stability
├── Fix critical bugs (dedup, throw, prompts)
├── Add Sentry error tracking
├── Add env validation
├── Add Next.js auth middleware
└── Add rate limiting

Phase 2 (Week 3-4): Quality & DevOps
├── Set up Vitest + test critical paths
├── Add Prettier + pre-commit hooks
├── Set up GitHub Actions CI/CD
├── Switch to Drizzle migrations
└── Refactor webhook handler

Phase 3 (Month 2): Features & Optimization
├── Add real-time meeting status updates
├── Implement payment/upgrade flow
├── Add analytics
├── Bundle optimization
└── Performance monitoring
```

---

## Appendix A: File Count Summary

| Directory          | Files | Notes                              |
|--------------------|-------|------------------------------------|
| `app/`             | 14    | Layouts, pages, API routes         |
| `components/`      | 68    | 60 shadcn/ui + 8 custom           |
| `modules/`         | 53    | Feature modules                    |
| `trpc/`            | 5     | API infrastructure                 |
| `db/`              | 2     | Schema + connection                |
| `lib/`             | 6     | SDK clients + utilities            |
| `hooks/`           | 2     | Shared hooks                       |
| `inngest/`         | 2     | Background job infrastructure      |
| `public/`          | 7     | Static assets                      |
| **Total**          | **~159** | Excluding config files          |

---

## Appendix B: Technology Decision Record

| Decision                    | Choice               | Alternatives Considered | Rationale (Inferred)         |
|-----------------------------|----------------------|------------------------|-------------------------------|
| Framework                   | Next.js 16           | Remix, Nuxt            | Full-stack RSC support        |
| ORM                         | Drizzle              | Prisma, TypeORM        | Type-safe, lightweight        |
| API layer                   | tRPC                 | REST, GraphQL          | End-to-end type safety        |
| Auth                        | Better Auth          | NextAuth, Clerk        | Self-hosted, flexible         |
| Video                       | Stream Video         | Twilio, Daily.co       | OpenAI Realtime integration   |
| Chat                        | Stream Chat          | Socket.io, Ably        | Pairs with Stream Video       |
| AI                          | OpenAI               | Anthropic, Gemini      | Realtime API support          |
| Background jobs             | Inngest              | BullMQ, Trigger.dev    | Serverless-friendly, step functions |
| UI components               | shadcn/ui            | Material UI, Chakra    | Composable, owns source code  |
| State management            | TanStack Query       | SWR, Apollo            | Deep tRPC integration         |
| Database                    | Neon PostgreSQL      | Supabase, PlanetScale  | Serverless PostgreSQL         |

---

*End of Technical Report*
