# 🏰 Fortress

> A full-stack, real-time secure messaging application built with Next.js, Upstash Redis, and TypeScript.

🔗 **Live Demo:** [realtime-chat-inky.vercel.app](https://realtime-chat-inky.vercel.app)

---

## Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Usage](#usage)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Technical Details](#-technical-details)
  - [Key Components](#key-components)
  - [Dependencies](#dependencies)
- [Future Enhancements](#-future-enhancements)
- [Version History](#-version-history)

---

## ✨ Features

### Core
- **Real-time messaging** — Instant, low-latency message delivery powered by Upstash Realtime (WebSocket-based pub/sub)
- **Friend system** — Send and receive friend requests by email address; manage your contacts list
- **Google OAuth authentication** — Secure, one-click sign-in via Google
- **Protected routes** — Middleware guards sensitive pages from unauthenticated access
- **Persistent chat history** — Messages stored and retrieved from Upstash Redis for fast access

### UI & Developer Experience
- **Responsive design** — Mobile-first UI built with TailwindCSS v4
- **Type-safe throughout** — End-to-end TypeScript from the API layer to the UI
- **Optimistic UI** — TanStack React Query manages server state and caching for a snappy experience
- **Icon library** — Clean, consistent iconography via Lucide React
- **Utility-first styling helpers** — `clsx`, `tailwind-merge`, and `class-variance-authority` for clean conditional class management
- **Relative timestamps** — Human-friendly message timestamps powered by `date-fns`

---

## 🚀 Quick Start

### Prerequisites

Before you begin, make sure you have the following installed and configured:

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | [Download](https://nodejs.org/) |
| npm / yarn / pnpm | Latest | Package manager of choice |
| Upstash account | — | [Sign up free](https://upstash.com/) — create a Redis DB and a Realtime instance |
| Google Cloud project | — | OAuth 2.0 credentials required ([guide](https://developers.google.com/identity/protocols/oauth2)) |

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/R2-STAR/Realtime-chat.git
cd Realtime-chat
```

**2. Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

**3. Configure environment variables**

Create a `.env.local` file in the project root:

```env
# ── Google OAuth ──────────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ── NextAuth ──────────────────────────────────────────────
NEXTAUTH_SECRET=your_random_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# ── Upstash Redis ─────────────────────────────────────────
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# ── Upstash Realtime ──────────────────────────────────────
UPSTASH_REALTIME_REST_URL=https://xxxx.upstash.io
UPSTASH_REALTIME_REST_TOKEN=your_upstash_realtime_token
```

> **Tip:** Generate a secure `NEXTAUTH_SECRET` with `openssl rand -base64 32`

### Usage

**Start the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Build for production:**

```bash
npm run build
npm run start
```

**Lint the codebase:**

```bash
npm run lint
```

#### Using the App

1. Sign in with your Google account on the landing page.
2. Navigate to **Add Friend** and enter a friend's email address to send a request.
3. Once the request is accepted, the conversation will appear in your sidebar.
4. Click a chat to open it and start messaging in real time.

---

## 📁 Project Structure

```
Realtime-chat/
│
├── public/                  # Static assets (images, icons, fonts)
│
├── src/
│   ├── app/                 # Next.js App Router pages & layouts
│   │   ├── (auth)/          # Auth-related routes (sign-in, etc.)
│   │   ├── (dashboard)/     # Protected dashboard routes
│   │   │   └── dashboard/
│   │   │       ├── chat/    # Individual chat room pages
│   │   │       └── ...
│   │   └── api/             # API route handlers (NextAuth, friend requests, messages)
│   │
│   ├── components/          # Reusable UI components
│   ├── helpers/             # Utility/helper functions
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Library configurations (Redis client, auth options, etc.)
│   └── types/               # Shared TypeScript type definitions
│
├── .gitignore
├── eslint.config.mjs        # ESLint configuration
├── next.config.ts           # Next.js configuration
├── package.json
├── postcss.config.mjs       # PostCSS / TailwindCSS configuration
└── tsconfig.json            # TypeScript configuration
```

---

## ⚙️ How It Works

Fortress combines several technologies to deliver a seamless real-time experience:

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                        │
│   Next.js App Router  ·  TanStack Query  ·  Upstash Realtime   │
└───────────────────┬──────────────────────────┬──────────────────┘
                    │ HTTP (REST API)           │ WebSocket (pub/sub)
                    ▼                           ▼
┌───────────────────────────┐    ┌─────────────────────────────┐
│   Elysia API Server       │    │   Upstash Realtime          │
│   (Eden type-safe client) │    │   (message broadcast)       │
└───────────┬───────────────┘    └─────────────────────────────┘
            │
            ▼
┌───────────────────────────┐
│   Upstash Redis           │
│   (persistent storage)    │
│   · Messages              │
│   · Friend relationships  │
│   · User sessions         │
└───────────────────────────┘
```

**Message flow:**
1. User sends a message via the chat UI.
2. The message is posted to the Elysia API endpoint.
3. The API persists the message to **Upstash Redis** and publishes an event to an **Upstash Realtime** channel.
4. All subscribed clients (the chat participants) receive the message instantly via WebSocket.
5. TanStack Query updates the UI optimistically without a full page reload.

**Authentication flow:**
1. User clicks "Sign in with Google."
2. NextAuth handles the OAuth handshake and creates a session.
3. Session data is stored in Redis for fast lookup.
4. Next.js middleware validates the session on every protected route request.

---

## 🔬 Technical Details

### Key Components

| Component | Responsibility |
|---|---|
| **Next.js App Router** | File-based routing, server components, API routes, and middleware for route protection |
| **Elysia + Eden** | Type-safe HTTP server (runs as a Next.js route handler) with an Eden client for end-to-end type inference between server and client |
| **Upstash Redis** | Serverless Redis used as the primary database — stores messages, user data, friend lists, and session tokens |
| **Upstash Realtime** | Serverless WebSocket pub/sub layer — pushes new messages to connected clients instantly without polling |
| **NextAuth.js** | Handles Google OAuth, JWT session management, and session persistence |
| **TanStack React Query** | Client-side server-state management, caching, and background refetching |
| **Zod** | Runtime schema validation for all API inputs — ensures data integrity |
| **TailwindCSS v4** | Utility-first CSS framework for building the responsive, consistent UI |

### Dependencies

#### Production

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.1.3 | React framework with App Router |
| `react` / `react-dom` | 19.2.3 | UI rendering |
| `elysia` | ^1.4.22 | Type-safe backend server |
| `@elysiajs/eden` | ^1.4.6 | End-to-end type-safe API client |
| `@upstash/redis` | ^1.36.1 | Serverless Redis client |
| `@upstash/realtime` | ^1.0.2 | WebSocket pub/sub client |
| `@tanstack/react-query` | ^5.90.18 | Server-state management |
| `zod` | ^4.3.5 | Schema validation |
| `date-fns` | ^4.1.0 | Date formatting utilities |
| `nanoid` | ^5.1.6 | Unique ID generation for messages |

#### Development

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5 | Static typing |
| `tailwindcss` | ^4 | Utility-first CSS |
| `@tailwindcss/postcss` | ^4 | TailwindCSS PostCSS integration |
| `eslint` | ^9 | Code linting |
| `eslint-config-next` | 16.1.3 | Next.js ESLint rules |

---

## 🔮 Future Enhancements

- [ ] **Group chats** — Support for multi-user chat rooms, not just one-on-one conversations
- [ ] **Message reactions** — Emoji reactions on individual messages
- [ ] **Read receipts** — Show "seen" indicators when a message has been read
- [ ] **Typing indicators** — Broadcast live "User is typing…" status
- [ ] **File & image sharing** — Upload and preview images/attachments inside chats
- [ ] **Push notifications** — Browser/mobile notifications for new messages when the tab is inactive
- [ ] **Message search** — Full-text search across conversation history
- [ ] **Dark mode** — System-aware and toggleable dark/light theme
- [ ] **Message deletion & editing** — Allow users to retract or update sent messages
- [ ] **User profiles** — Custom display names, avatars, and status messages
- [ ] **End-to-end encryption** — Client-side encryption for truly private conversations
- [ ] **Rate limiting** — Protect the API from spam and abuse

---

## 📋 Version History

| Version | Date | Notes |
|---|---|---|
| **0.1.0** | 2025 | Initial release — real-time 1-on-1 messaging, Google auth, friend requests via email, Redis persistence, responsive UI |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
