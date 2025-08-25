import React from "react";
import { SessionStatus } from "@/app/types";

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isPTTUserSpeaking: boolean;
  handleTalkButtonDown: () => void;
  handleTalkButtonUp: () => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (val: boolean) => void;
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (val: boolean) => void;
  codec: string;
  onCodecChange: (newCodec: string) => void;
}

function BottomToolbar({
  sessionStatus,
  onToggleConnection,
  isPTTActive,
  setIsPTTActive,
  isPTTUserSpeaking,
  handleTalkButtonDown,
  handleTalkButtonUp,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded,
  isAudioPlaybackEnabled,
  setIsAudioPlaybackEnabled,
  codec,
  onCodecChange,
}: BottomToolbarProps) {
  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  const handleCodecChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCodec = e.target.value;
    onCodecChange(newCodec);
  };

  function getConnectionButtonLabel() {
    if (isConnected) return "Disconnect";
    if (isConnecting) return "Connecting...";
    return "Connect";
  }

  function getConnectionButtonClasses() {
    const baseClasses = "text-white text-base p-2 w-36 rounded-md h-full";
    const cursorClass = isConnecting ? "cursor-not-allowed" : "cursor-pointer";

    if (isConnected) {
      // Connected -> label "Disconnect" -> red
      return `bg-red-600 hover:bg-red-700 ${cursorClass} ${baseClasses}`;
    }
    // Disconnected or connecting -> label is either "Connect" or "Connecting" -> black
    return `bg-black hover:bg-gray-900 ${cursorClass} ${baseClasses}`;
  }

  return (
    <div className="bg-white border-t px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {isPTTActive ? (
          <button
            onMouseDown={handleTalkButtonDown}
            onMouseUp={handleTalkButtonUp}
            onTouchStart={handleTalkButtonDown}
            onTouchEnd={handleTalkButtonUp}
            disabled={!isConnected}
            className={`px-4 py-2 rounded-full font-medium ${
              isPTTUserSpeaking
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isPTTUserSpeaking ? "🔴 Speaking..." : "🎤 Hold to Talk"}
          </button>
        ) : null}

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isPTTActive}
            onChange={(e) => setIsPTTActive(e.target.checked)}
            disabled={!isConnected}
            className="w-4 h-4"
          />
          <span className="text-sm">Push to talk</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isAudioPlaybackEnabled}
            onChange={(e) => setIsAudioPlaybackEnabled(e.target.checked)}
            disabled={!isConnected}
            className="w-4 h-4"
          />
          <span className="text-sm">Audio playback</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isEventsPaneExpanded}
            onChange={(e) => setIsEventsPaneExpanded(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Logs</span>
        </label>

        <div className="flex items-center space-x-2">
          <label htmlFor="codec-select" className="text-sm">Codec:</label>
          {/*
            Codec selector – Lets you force the WebRTC track to use 8 kHz 
            PCMU/PCMA so you can preview how the agent will sound 
            (and how ASR/VAD will perform) when accessed via a 
            phone network. Selecting a codec reloads the page with ?codec=...
            which our App-level logic picks up and applies via a WebRTC monkey
            patch (see codecPatch.ts).
          */}
          <select
            id="codec-select"
            value={codec}
            onChange={handleCodecChange}
            className="text-sm p-1 border rounded"
          >
            <option value="opus">Opus (48 kHz)</option>
            <option value="pcmu">PCMU (8 kHz)</option>
            <option value="pcma">PCMA (8 kHz)</option>
          </select>
        </div>
      </div>

      <button
        onClick={onToggleConnection}
        disabled={isConnecting}
        className={getConnectionButtonClasses()}
      >
        {getConnectionButtonLabel()}
      </button>
    </div>
  );
}

export default BottomToolbar;
