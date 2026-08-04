import React, { useState, useEffect, useRef } from "react";
import { usePoker } from "../hooks/usePoker";
import { useCurrentPlayer } from "../hooks/useCurrentPlayer";
import {
  Bug,
  X,
  Upload,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

export const BugReportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { roomId, activeStory, isRevealed, players } = usePoker();
  const currentPlayer = useCurrentPlayer();

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const getGamePhase = () => {
    if (isRevealed) {
      return "Revealed";
    }
    if (!activeStory) {
      return "Idle / Waiting for Story";
    }
    return "Voting";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image is too large (max 5 MB).");
      return;
    }

    setErrorMsg(null);
    setScreenshot(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error("VITE_DISCORD_WEBHOOK_URL is missing in the .env file");
      setErrorMsg("Webhook configuration error.");
      setIsSubmitting(false);
      return;
    }

    const embedPayload = {
      embeds: [
        {
          title: "🐛 New Bug Report",
          color: 0xef4444,
          description: description,
          fields: [
            {
              name: "Reporter Email",
              value: email.trim() || "Not provided",
              inline: false,
            },
            {
              name: "Room ID",
              value: roomId || "N/A",
              inline: true,
            },
            {
              name: "Game Phase",
              value: getGamePhase(),
              inline: true,
            },
            {
              name: "Total Players",
              value: String(players?.length || 0),
              inline: true,
            },
            {
              name: "Player Name",
              value: currentPlayer?.name || "Anonymous",
              inline: true,
            },
            {
              name: "Player ID",
              value: currentPlayer?.id || "N/A",
              inline: true,
            },
            {
              name: "Browser / OS",
              value: navigator.userAgent,
              inline: false,
            },
          ],

          image: screenshot
            ? { url: "attachment://screenshot.png" }
            : undefined,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      let response: Response;

      if (screenshot) {
        const formData = new FormData();
        formData.append("payload_json", JSON.stringify(embedPayload));
        formData.append("files[0]", screenshot, "screenshot.png");

        response = await fetch(webhookUrl, {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(embedPayload),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to send to Discord.");
      }

      setIsSuccess(true);
      setDescription("");
      setEmail("");
      setScreenshot(null);
      setCooldown(60);

      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Bug report submit error:", err);
      setErrorMsg("Failed to send the message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-full shadow-lg border border-zinc-800 transition-all duration-200 cursor-pointer"
        title="Report Bug"
      >
        <Bug className="w-5 h-5 text-red-400" />
        <span className="text-xs font-bold uppercase tracking-wide pr-1 hidden sm:inline">
          Report
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl relative text-zinc-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800/50">
              <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
                <Bug className="w-6 h-6 text-red-400" />
                Found a feature?
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSuccess ? (
              <div className="p-8 flex flex-col items-center text-center gap-2">
                <Check className="w-12 h-12 text-emerald-400 animate-bounce" />
                <p className="font-bold text-lg text-zinc-100">
                  Thank you for reporting!
                </p>
                <p className="text-sm text-zinc-400">
                  Your report has been successfully sent to the team.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    What Happened? <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what broke... or what works suspiciously well."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    Feature Hunter Email{" "}
                    <span className="lowercase font-normal tracking-normal text-zinc-500">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="feature.hunter@company.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    Proof Of Feature{" "}
                    <span className="lowercase font-normal tracking-normal text-zinc-500">
                      (max 5MB)
                    </span>
                  </label>

                  {screenshot ? (
                    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm">
                      <span className="truncate text-emerald-400 font-medium max-w-[240px]">
                        {screenshot.name}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full border-2 border-dashed border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/30 transition-all cursor-pointer group">
                      <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                      <span className="text-sm font-medium">
                        Drop evidence here...
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-xl p-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-3 mt-auto">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting || cooldown > 0 || !description.trim()
                    }
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed cursor-pointer text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : cooldown > 0 ? (
                      `Wait (${cooldown}s)`
                    ) : (
                      "Expose Feature"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
