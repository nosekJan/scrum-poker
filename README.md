# Kestra Poker 🃏

A modern, fast, and lightweight web application for Planning Poker (Scrum Poker) designed for an unlimited number of participants. This project was created as an internal IDP solution to replace limited external tools.

## ✨ Features Built So Far

- **Hybrid Real-time Architecture:** Separates Supabase Presence (strictly for connection status and player tracking) from Broadcast channels (for card casting, reveals, and story state propagation). This optimized dual-channel system completely eliminates WebSocket data bloat and rate-limiting disconnects (`Status: CLOSED`).
- **Dynamic Mobile-First Layout:** Responsive Grid (Tailwind CSS v4) that dynamically rearranges the UI based on viewport size. On mobile/tablets, the voting deck shifts directly beneath the player desk to eliminate scrolling, while expanding into a multi-column side-by-side dashboard on desktop viewports.
- **Contextual Empty States:** Smart UX headers that replace generic placeholders with actionable real-time guidance (e.g., _"Waiting for host to set a story..."_ for players vs. _"Please set a story to begin voting..."_ for hosts).
- **Unique Shareable Rooms:** Automatic 6-character room generation with dynamic routing using React Router.
- **Persistent Identity:** Automatically persists player identities via `localStorage` and keeps accurate connection tracking using `sessionStorage`.
- **Ghost Player Protection & Host Migration:** Smart synchronic tracking that instantly removes disconnected players from the board without page refreshes. Includes automatic host reassignment to the oldest active player if the current lead leaves.
- **Auto-Reveal Engine:** Automatically flips cards and calculates the room average the exact millisecond the last participant locks in their vote, managed safely via the host device to avoid multi-client network collision.
- **Granular Vote Breakdown:** Clean, non-intrusive distribution pills displayed beneath the average, showing percentage and vote counts for better team alignment.
- **Grooming Stopwatch & History:** Integrated running timer tracking the duration of active stories, with persistent database history tabs (Active/Completed/All).
- **One-Click Re-Vote:** Allows instant resetting of current votes for a fresh estimation round while preserving the active story and stopwatch state.
- **Graceful Session Termination:** Awaits asynchronous websocket handshakes before unmounting elements, ensuring all players are properly kicked back to the lobby when the host ends a session.
- **Modern Dark UI:** Tailored with Tailwind CSS (v4) for a premium, distraction-free estimation environment.

## 🚀 Tech Stack

- **Frontend:** React (v19), TypeScript, Vite
- **Styling:** Tailwind CSS (v4)
- **Routing:** React Router DOM
- **Real-time Backend:** Supabase (Broadcast & Presence)

## 🛠️ Local Development

### 1. Clone the repository and install dependencies

```bash
git clone <your-repo-url>
cd css-poker
npm install
```
