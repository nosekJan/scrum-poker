# Kestra Poker 🃏

A modern, fast, and lightweight web application for Planning Poker (Scrum Poker) designed for an unlimited number of participants. This project was created as an internal IDP solution to replace limited external tools.

## ✨ Features Built So Far

- **Instant Real-time Sync:** Powered by Supabase Broadcast for millisecond voting latency and Presence to track active users.
- **Unique Shareable Rooms:** Automatic 6-character room generation with dynamic routing using React Router.
- **Persistent Identity:** Automatically persists player identities via `localStorage` and keeps accurate connection tracking using `sessionStorage`.
- **Ghost Player Protection:** Smart synchronic tracking that instantly removes disconnected or leaving players from the board without requiring page refreshes.
- **Auto-Reveal Engine:** Automatically flips cards and calculates the room average the exact millisecond the last participant locks in their vote.
- **Granular Vote Breakdown:** Clean, non-intrusive distribution pills displayed beneath the average, showing percentage and vote counts for better team alignment.
- **Grooming Stopwatch & History:** Integrated running timer tracking the duration of active stories, with persistent local history tabs (Active/Completed/All).
- **One-Click Re-Vote:** Allows instant resetting of current votes for a fresh estimation round while preserving the active story and stopwatch state.
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
