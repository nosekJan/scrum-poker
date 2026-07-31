import React from "react";
import { UserPlus, UserMinus, UserX } from "lucide-react";

export type RoomNotificationType = "join" | "leave" | "kick";

export interface RoomNotification {
  id: string;
  type: RoomNotificationType;
  username: string;
}

interface RoomNotificationsProps {
  notifications: RoomNotification[];
}

export const RoomNotifications: React.FC<RoomNotificationsProps> = ({
  notifications,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-16 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notif) => {
        return (
          <div
            key={notif.id}
            className={`
              flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium
              shadow-lg backdrop-blur-md border transition-all duration-300
              animate-in fade-in slide-in-from-top-2
              ${
                notif.type === "join"
                  ? "bg-zinc-900/90 border-emerald-500/30 text-zinc-200"
                  : "bg-zinc-900/90 border-rose-500/30 text-zinc-300"
              }
            `}
          >
            {notif.type === "join" && (
              <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            {notif.type === "leave" && (
              <UserMinus className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            {notif.type === "kick" && (
              <UserX className="w-4 h-4 text-rose-400 shrink-0" />
            )}

            <span>
              <strong className="text-white font-semibold">
                {notif.username}
              </strong>{" "}
              {notif.type === "join" && "joined"}
              {notif.type === "leave" && "left"}
              {notif.type === "kick" && "was kicked"}
            </span>
          </div>
        );
      })}
    </div>
  );
};
