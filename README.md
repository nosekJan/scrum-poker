# Scrum Poker 🃏

A modern, fast, and lightweight web application for Planning Poker (Scrum Poker) designed for an unlimited number of participants. This project was created as an internal IDP solution to replace limited external tools.

## ✨ Features Built So Far

- **In-App Bug Reporting & Discord Integration:** Includes a floating action widget allowing users to report issues directly to the development team via Discord webhooks. Features automatic context capture (Room ID, player state), drag-and-drop screenshot uploads (up to 5MB), and a built-in 60-second cooldown rate limiter to prevent spam, all wrapped in the modern Zinc/Emerald dark UI.
- **Seamless Late Joiner Engine & Kicked State Sync:** Empowers participants to jump directly into an active room and cast votes mid-session. Includes strict UI buffer states ("JOINED", "KICKED", and "OFFLINE") that accurately track edge-case users. Synchronizes evicted player IDs across room state requests to prevent incorrect offline fallback indicators upon client reconnects.
- **In-App Changelog (What's New):** Integrates an isolated, lightweight versioning widget in the Lobby screen that opens a timeline modal displaying the application's release history. Uses browser local storage to track read states and signals unread updates using an ambient pulsing emerald indicator.
- **Advanced Host Moderation (Kick & Promote):** Empowers room hosts with direct moderation tools to instantly eject players (Kick) or reassign host privileges (Promote) directly from the player grid, synchronized instantly across all clients via Supabase Broadcast.
- **Dynamic Mobile-First Layout:** Responsive Grid (Tailwind CSS) that dynamically rearranges the UI based on viewport size. On mobile/tablets, the voting deck shifts directly beneath the player desk to eliminate scrolling, while expanding into a multi-column side-by-side dashboard on desktop viewports.
- **Smart Host Distance-Based Tie-Break Engine:** Instantly evaluates split decisions when multiple cards match the highest pick count, using absolute distance calculations relative to the mathematical average anchor to provide hosts with precise Higher vs. Lower override parameters. Automatically selects the single closest card without triggering unnecessary tie-break overrides.
- **Fluid Viewport Calculation Height:** Utilizes custom dynamic viewport constraints (`calc(100vh - 390px)`) to keep the right-hand panel perfectly matched to the board layout without dropping cards below the OS taskbar edge.
- **Crowded Room Spacing Engine:** Automatically compresses card asset dimensions to compact bounding frames (`w-10 h-14`) and close grid spacing once a session scales past 10 active players, squeezing massive 15+ user rooms into two concise, readable columns.
- **Ergonomic Card Asset Padding:** Downscaled baseline player avatar icons to inject enhanced internal padding and breathing room within standard card frames, preventing visual asset clipping while leaving the compact footprint untouched for crowded scenarios.
- **Interactive Player Avatars & Reserved Host Badge:** Replaced baseline emojis with a Lucide React icon suite for player avatars. Automatically excludes and reserves the Crown icon exclusively for the active room host.
- **In-Room Event Notifications:** Real-time toast system announcing player join, leave, kick, and host promotion events directly within the active poker session.
- **Session Lifecycle & Ejection Control:** Handles session termination and host eviction with dedicated modal dialogues (`KickedModal`, `SessionEndedModal`), cleanly unsubscribing client channels to prevent automatic reconnection loops.
- **Modular Real-Time Architecture:** Modularized Supabase WebSocket handlers into isolated utility modules (`pokerEventHandlers.ts`, `pokerChannelActions.ts`) to maintain clean separation of concerns, resolve React StrictMode re-renders, and ensure TypeScript type safety.
- **Hybrid Real-time Architecture:** Separates Supabase Presence (strictly for connection status and player tracking) from Broadcast channels (for card casting, reveals, and story state propagation). This optimized dual-channel system completely eliminates WebSocket data bloat and rate-limiting disconnects (`Status: CLOSED`).
- **Destructive Action Safety Gates:** Intercepts database eviction triggers with native asynchronous modal prompt gatekeepers, blocking accidental target clearances during high-speed scroll motions.
- **Lobby Navigation & Recent Rooms History:** Persists up to 3 previously visited planning rooms inside local browser storage to prevent layout overflow. Features reactive emerald ambient illumination when a history item matches the current text field state, alongside single-click cache eviction (`✕`).
- **Host Power Shortcuts:** Integrated native `Ctrl + Enter` (and `Cmd + Enter`) keydown bindings inside the story initiation viewport area for rapid mouse-free card setup.
- **Continuous Status Pulse Badge:** Implemented continuous micro-animation pulsing states on active side-navigation counters to telegraph current gaming operations clearly across any viewport state or open panel tab.
- **Contextual Empty States:** Smart UX headers that replace generic placeholders with actionable real-time guidance (e.g., _"Waiting for host to set a story..."_ for players vs. _"Please set a story to begin voting..."_ for hosts).
- **Smart Non-Numeric Average Logic:** Gracefully isolates non-numeric voting outliers (like `?`). If a team unanimously triggers non-numeric estimates, the board safely calculates symbolic results instead of defaulting to numeric errors or false `0.0` outputs.
- **Branded Scrollbar Customization:** Replaced crude default window/container sliders with fine, custom dark track components styled with reactive, fluid emerald accenting upon mouse hover.
- **Unique Shareable Rooms & Deep-Linking:** Automatic room generation with dynamic routing and query parameter detection that automatically pre-fills the room ID for single-click player onboarding.
- **Persistent Identity:** Automatically persists player identities via `localStorage` and keeps accurate connection tracking using `sessionStorage`.
- **Ghost Player Protection & Host Migration:** Smart synchronic tracking that instantly removes disconnected players from the board without page refreshes. Includes automatic host reassignment to the oldest active player if the current lead leaves.
- **Auto-Reveal Engine:** Automatically flips cards and calculates the room average the exact millisecond the last participant locks in their vote, managed safely via the host device to avoid multi-client network collision.
- **Granular Vote Breakdown:** Clean, non-intrusive distribution pills displayed beneath the average, showing percentage and vote counts for better team alignment.
- **Grooming Stopwatch & History:** Integrated running timer tracking the duration of active stories, with persistent database history tabs (Active/Completed/All).
- **One-Click Re-Vote:** Allows instant resetting of current votes for a fresh estimation round while preserving the active story and stopwatch state.
- **Graceful Session Termination:** Awaits asynchronous websocket handshakes before unmounting elements, ensuring all players are properly kicked back to the lobby when the host ends a session.
- **Modern Dark UI:** Tailored with Tailwind CSS for a premium, distraction-free estimation environment.
- **CSS 3D Flip Animation Engine:** Implements smooth, hardware-accelerated 3D perspective transitions (`preserve-3d` and `rotateY`) that realistically flip player cards simultaneously during the reveal phase, preserving 3D backface visibility without alpha channel bleed.
- **Smart Clipboard Invite Links:** Replaces raw static room hashes with an intelligent share button that dynamically captures the current environment origin (handling `localhost` vs production domains) and copies a full destination URL with temporal UI state feedback ("Link Copied!").
- **Host Story Clipboard Extraction:** Enables session hosts to instantly extract clean story titles from the history logs into the clipboard via a space-optimized vertical action stack, accompanied by reactive, temporal checkmark micro-feedback (`✔️`).

## 🚀 Tech Stack

- **Frontend:** React (v19), TypeScript, Vite
- **Styling & Animations:** Tailwind CSS (v4), Lucide React
- **Routing:** React Router DOM
- **Real-time Backend:** Supabase (Broadcast & Presence)

## 🛠️ Local Development

### 1. Clone the repository and install dependencies

```bash
git clone <your-repo-url>
cd scrum-poker
npm install
npm run dev
```

### 2. Environment Configuration

To enable the in-app Bug Report widget, create a `.env` file in the root directory and add your Discord webhook URL:

```env
VITE_DISCORD_WEBHOOK_URL="[https://discord.com/api/webhooks/your_webhook_id/your_webhook_token](https://discord.com/api/webhooks/your_webhook_id/your_webhook_token)"
```
