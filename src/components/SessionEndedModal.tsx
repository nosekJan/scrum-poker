import { LogOut } from "lucide-react";

interface SessionEndedModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export const SessionEndedModal = ({
  isOpen,
  onConfirm,
}: SessionEndedModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
          <LogOut className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Session Ended</h3>
        <p className="text-neutral-400 text-sm mb-6">
          The host has ended this planning session.
        </p>
        <button
          onClick={onConfirm}
          className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium cursor-pointer transition-colors border border-neutral-700"
        >
          Return to Lobby
        </button>
      </div>
    </div>
  );
};
