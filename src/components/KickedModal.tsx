import { UserX } from "lucide-react";

interface KickedModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export const KickedModal = ({ isOpen, onConfirm }: KickedModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-xl p-8 text-center shadow-xl">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
          <UserX className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          You have been removed
        </h2>
        <p className="text-neutral-400 mb-6 text-sm">
          The host has kicked you out of this poker session.
        </p>
        <button
          className="w-full px-6 py-2.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 rounded-lg transition-colors font-medium text-sm text-white cursor-pointer"
          onClick={onConfirm}
        >
          Return to Lobby
        </button>
      </div>
    </div>
  );
};
