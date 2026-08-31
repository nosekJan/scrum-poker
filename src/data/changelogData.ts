export interface ChangelogItem {
  version: string;
  date: string;
  title: string;
  changes: {
    type: "feature" | "fix" | "improvement";
    text: string;
  }[];
}

export const CURRENT_VERSION = "1.6.1";

export const CHANGELOG: ChangelogItem[] = [
 {
    version: "1.6.1",
    date: "August 31, 2026",
    title: "Kicked State Persistence, 3D Rendering & Math Precision",
    changes: [
      { type: "fix", text: "Refined suggested estimate math and distance-based tie-break calculation." },
      { type: "fix", text: "Prevented self-kick status assignment when syncing kickedUserIds list." },
      { type: "fix", text: "Persisted kicked state and hid action menus for offline and kicked player cards." },
      { type: "fix", text: "Applied opacity directly to card face containers to preserve 3D backface hiding." },
      { type: "improvement", text: "Cleared kicked status upon player rejoin and removed legacy confetti logic." }
    ]
  },
  {
  version: "1.6.0",
  date: "August 4, 2026",
  title: "Lucide Avatars, Live Notifications & Modular Realtime Engine",
  changes: [
    { type: "feature", text: "Replaced player emojis with Lucide icons and reserved the Crown badge exclusively for room hosts." },
    { type: "feature", text: "Added real-time toast notifications for player joins, departures, kicks, and host promotions." },
    { type: "feature", text: "Implemented dedicated modals for kicked players and terminated sessions." },
    { type: "improvement", text: "Modularized Supabase channel logic, event handlers, and PlayerDesk component with strict TypeScript typing." },
    { type: "fix", text: "Resolved ghost player desyncs, host role synchronization, and channel re-subscription loops." },
    { type: "fix", text: "Polished Bug Report form styling, cursor pointers, and button UI consistency." }
  ]
  },
  {
    version: "1.5.2",
    date: "July 21, 2026",
    title: "In-App Bug Reporting & UI Enhancements",
    changes: [
      { type: "feature", text: "Implemented a floating Bug Report widget with Discord webhook integration and screenshot upload support." },
      { type: "improvement", text: "Updated PokerContext to expose roomId." }
    ]
  },
  {
    version: "1.5.1",
    date: "July 21, 2026",
    title: "Late Joiners & Architecture Refactor",
    changes: [
      { type: "feature", text: "Allowed players to seamlessly cast votes when joining an active voting phase." },
      { type: "feature", text: "Added specific 'JOINED' and 'OFFLINE' UI status tracking for players connecting or disconnecting during the reveal phase." },
      { type: "improvement", text: "Extracted useCurrentPlayer hook for centralized and more reliable player state management." },
      { type: "improvement", text: "Refactored usePokerChannel with named event handlers for better readability and performance." }
    ]
  },
    {
   version: "1.5.0",
    date: "July 16, 2026",
    title: "Host Controls, Changelog & State Sync",
    changes: [
      { type: "feature", text: "Added advanced host tools to kick players from the room and promote others to host." },
      { type: "feature", text: "Implemented 'What's New' changelog modal to seamlessly display release history." },
      { type: "feature", text: "Added a discrete floating version widget to the Lobby screen with unread update indicators." },
      { type: "improvement", text: "Refactored poker context and real-time hooks for optimized state synchronization." }
    ]
  },
  {
    version: "1.4.1",
    date: "June 9, 2026",
    title: "Micro-interactions & Polishing",
    changes: [
      { type: "feature", text: "Added interactive copy-to-clipboard actions with reactive timeout micro-feedback for session hosts." },
      { type: "improvement", text: "Downscaled default avatar emoji sizes to prevent card edge clipping." },
      { type: "fix", text: "Fixed layout alignment and prevented text overflow on compact player grids." }
    ]
  },
  {
    version: "1.4.0",
    date: "June 4, 2026",
    title: "Global Rebranding & Anonymization",
    changes: [
      { type: "improvement", text: "Global rebranding of the application to Scrum Poker." },
      { type: "feature", text: "Implemented complete anonymization of active session players." },
      { type: "improvement", text: "Optimized repository push connectivity and verified deployment pipelines." }
    ]
  },
  {
    version: "1.3.0",
    date: "June 3, 2026",
    title: "Expanded Emojis & Grid Optimization",
    changes: [
      { type: "feature", text: "Implemented expanded pool of 50 unique player emojis with active session cache and upscaled visibility." },
      { type: "improvement", text: "Compressed crowded player grid dimensions and spacing to prevent layout overflow." },
      { type: "improvement", text: "Added confirmation dialog prompt before executing story deletion." },
      { type: "fix", text: "Limited recent room history to 3 items to prevent layout overflow on high scaling screens." }
    ]
  },
  {
    version: "1.2.0",
    date: "June 2, 2026",
    title: "3D Animations & Celebrations",
    changes: [
      { type: "feature", text: "Triggered visual confetti animation on unanimous votes." },
      { type: "feature", text: "Added smooth 3D flip animations to player cards." },
      { type: "feature", text: "Added quick copy button to room name input in Lobby." },
      { type: "fix", text: "Fixed automatic prefilling of room name from URL query parameters." },
      { type: "fix", text: "Fixed disabled styling states for the active story control buttons." }
    ]
  },
  {
    version: "1.1.1",
    date: "June 2, 2026",
    title: "Smart Host, Resiliency & User Management",
    changes: [
      { type: "feature", text: "Added Host management with auto-delegation, End Session button, and resolved reveal state desync." },
      { type: "feature", text: "Added Claim Host button to UI for manual role reclamation." },
      { type: "feature", text: "Network resiliency handler automatically re-tracks active player votes upon reconnection." },
      { type: "improvement", text: "Implemented smart host tie-break system and hid unvoted estimates for players." },
      { type: "improvement", text: "Froze voting statistics during reveal and introduced offline spectator indicators." },
      { type: "fix", text: "Broadcasted explicit host leaving to prevent presence ghost sessions during reveal." },
      { type: "fix", text: "Simplified spectator logic and auto-reveal state." }
    ]
  },
  {
    version: "1.0.0",
    date: "June 1, 2026",
    title: "Core Poker Engine",
    changes: [
      { type: "feature", text: "Developed fundamental poker Card component with interactive Tailwind animations." },
      { type: "feature", text: "Created Lobby screen with local storage name and room history persistence." },
      { type: "feature", text: "Integrated Supabase Realtime presence and broadcast for instant real-time voting synchronization." },
      { type: "feature", text: "Built Reveal and Reset cards functionalities with synchronized global state and average calculations." },
      { type: "feature", text: "Designed active, completed, and all stories workflow tabs with a grooming stopwatch." }
    ]
  }
];