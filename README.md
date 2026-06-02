# Kestra Poker 🃏

A modern, fast, and lightweight web application for Planning Poker (Scrum Poker) designed for an unlimited number of participants. This project was created as an internal IDP solution to replace limited external tools.

## ✨ Features Built So Far

- **Hybrid Real-time Architecture:** Separates Supabase Presence (strictly for connection status and player tracking) from Broadcast channels (for card casting, reveals, and story state propagation). This optimized dual-channel system completely eliminates WebSocket data bloat and rate-limiting disconnects (`Status: CLOSED`).
- **Dynamic Mobile-First Layout:** Responsive Grid (Tailwind CSS v4) that dynamically rearranges the UI based on viewport size. On mobile/tablets, the voting deck shifts directly beneath the player desk to eliminate scrolling, while expanding into a multi-column side-by-side dashboard on desktop viewports.
- **Crowded Room Spacing Engine:** Automatically compresses card asset dimensions, grid bounds, and typographic scales when a session scales beyond 10 simultaneous users, guaranteeing no desktop-level viewport breakages.
- **Lobby Navigation & Recent Rooms History:** Persists up to 5 previously visited planning rooms inside local browser storage. Features reactive emerald ambient illumination when a history item matches the current text field state, alongside single-click cache eviction (`✕`).
- **Host Power Shortcuts:** Integrated native `Ctrl + Enter` (and `Cmd + Enter`) keydown bindings inside the story initiation viewport area for rapid mouse-free card setup.
- **Continuous Status Pulse Badge:** Implemented continuous micro-animation pulsing states on active side-navigation counters to telegraph current gaming operations clearly across any viewport state or open panel tab.
- **Contextual Empty States:** Smart UX headers that replace generic placeholders with actionable real-time guidance (e.g., _"Waiting for host to set a story..."_ for players vs. _"Please set a story to begin voting..."_ for hosts).
- **Smart Non-Numeric Average Logic:** Gracefully isolates non-numeric voting outliers (like `☕` or `?`). If a team unanimously triggers a coffee break, the board safely calculates symbolic results instead of defaulting to numeric errors or false `0.0` outputs.
- **Branded Scrollbar Customization:** Replaced crude default window/container sliders with fine, custom dark track components styled with reactive, fluid emerald accenting upon mouse hover.
- **Unique Shareable Rooms & Deep-Linking:** Automatic room generation with dynamic routing and query parameter detection that automatically pre-fills the room ID for single-click player onboarding.
- **Persistent Identity:** Automatically persists player identities via `localStorage` and keeps accurate connection tracking using `sessionStorage`.
- **Ghost Player Protection & Host Migration:** Smart synchronic tracking that instantly removes disconnected players from the board without page refreshes. Includes automatic host reassignment to the oldest active player if the current lead leaves.
- **Auto-Reveal Engine:** Automatically flips cards and calculates the room average the exact millisecond the last participant locks in their vote, managed safely via the host device to avoid multi-client network collision.
- **Granular Vote Breakdown:** Clean, non-intrusive distribution pills displayed beneath the average, showing percentage and vote counts for better team alignment.
- **Grooming Stopwatch & History:** Integrated running timer tracking the duration of active stories, with persistent database history tabs (Active/Completed/All).
- **One-Click Re-Vote:** Allows instant resetting of current votes for a fresh estimation round while preserving the active story and stopwatch state.
- **Graceful Session Termination:** Awaits asynchronous websocket handshakes before unmounting elements, ensuring all players are properly kicked back to the lobby when the host ends a session.
- **Modern Dark UI:** Tailored with Tailwind CSS (v4) for a premium, distraction-free estimation environment.
- **CSS 3D Flip Animation Engine:** Implements smooth, hardware-accelerated 3D perspective transitions (`preserve-3d` and `rotateY`) that realistically flip player cards simultaneously during the reveal phase.
- **Unanimous Celebration System:** Integrates a dynamic canvas confetti engine that automatically triggers a customized emerald-themed celebration the exact millisecond a 100% unanimous team vote is achieved.
- **Smart Clipboard Invite Links:** Replaces raw static room hashes with an intelligent share button that dynamically captures the current environment origin (handling `localhost` vs production domains) and copies a full destination URL with temporal UI state feedback ("Link Copied!").

## 🚀 Tech Stack

- **Frontend:** React (v19), TypeScript, Vite
- **Styling & Animations:** Tailwind CSS (v4), Canvas Confetti
- **Routing:** React Router DOM
- **Real-time Backend:** Supabase (Broadcast & Presence)

## 🛠️ Local Development

### 1. Clone the repository and install dependencies

```bash
git clone <your-repo-url>
cd css-poker
npm install
npm run dev
```
