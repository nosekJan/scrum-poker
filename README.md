# Kestra Poker 🃏

A modern, fast, and lightweight web application for Planning Poker (Scrum Poker) designed for an unlimited number of participants. This project was created as an internal IDP solution to replace limited external tools.

## ✨ Features Built So Far

- **Instant Real-time Sync:** Powered by Supabase Broadcast for millisecond voting latency and Presence to track active users.
- **Unique Shareable Rooms:** Automatic 6-character room generation with dynamic routing using React Router.
- **Persistent Identity:** Automatically persists player identities via `localStorage` and keeps accurate connection tracking using `sessionStorage`.
- **Ghost Player Protection:** Smart synchronic tracking that instantly removes disconnected or leaving players from the board without requiring page refreshes.
- **Modern Dark UI:** Tailored with Tailwind CSS (v4) for a premium, distraction-free estimation environment.

## 🚀 Tech Stack

- **Frontend:** React (v19), TypeScript, Vite
- **Styling:** Tailwind CSS (v4)
- **Routing:** React Router DOM
- **Real-time Backend:** Supabase (Broadcast & Presence)

## 🛠️ Local Development

### 1. Install dependencies

```bash
npm install
```
