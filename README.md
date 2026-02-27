# Real-Time Chat Application

A modern, full-stack real-time chat application built with Next.js 15, structured around a Convex serverless backend and protected by Clerk authentication. 

## ✨ Key Features

### 👤 User Authentication & Profiles
* Secure sign-up/sign-in flows via **Clerk**.
* Rich user profiles automatically synced to the database.
* Real-time **Online/Offline status** indicators and "last seen" timestamps.

### 💬 Messaging & Real-Time Sync
* **1-on-1 Direct Messaging** with instant delivery.
* **Group Chats** with custom group names, and support for 2+ members.
* **Typing Indicators** letting you know when someone is currently drafting a message.
* **Read Receipts** showing unread message badges in the sidebar.
* Support for **Message Deletion**.

### 📱 Enhanced Chat UI
* **Message Reactions**: React to any message with emojis (👍, ❤️, 😂, 😮, 😢). Supports grouping and shows exactly *who* reacted with what emoji.
* **Network Reliability**: Built-in offline detection. The UI gracefully prevents message sends when offline, shows error banners, and saves failed messages with a one-click **Retry** mechanism.
* **Auto-scrolling**: The chat panel automatically snaps to the newest messages as they arrive, and features a manual "New messages" scroll button if you're reading history.

## 🛠️ Tech Stack

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router, React 19)
* **Backend & Real-time Database:** [Convex](https://www.convex.dev/)
* **Authentication:** [Clerk](https://clerk.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Language:** TypeScript

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd tarsense-assesment
npm install
```

### 2. Environment Setup
Create a `.env.local` or `.env` file at the root of the project with your keys:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Convex Dev deployment URL
NEXT_PUBLIC_CONVEX_URL=https://<your-dev-domain>.convex.cloud
```

### 3. Run Development Servers
You will need to run two processes simultaneously in different terminal windows:

**Terminal 1:** Run Convex to sync your database schema and functions
```bash
npx convex dev
```

**Terminal 2:** Run the Next.js development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to start chatting!

## 📦 Database Schema (Convex)

The database schema is strictly typed with Convex. Key tables include:
* `users`: Stores clerk synced data and online statuses.
* `conversations`: Manages 1-on-1 and Group chats, tracking participants and the last message.
* `messages`: The core message details spanning sender, content, deletion status, and emoji reactions.
* `typingIndicators` & `readReceipts`: Utility tables optimizing real-time feedback flows.

## 🚀 Deployment

The Next.js frontend is optimized to be deployed on **Vercel**. 
The Convex backend can be pushed to a specialized production environment using:
```bash
npx convex deploy
```
*Note: Make sure to map your new production Convex URL (`NEXT_PUBLIC_CONVEX_URL`) and your production Clerk API Keys in your Vercel Environment Variables.*
