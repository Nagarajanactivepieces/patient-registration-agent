"use-client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { TranscriptItem } from "@/app/types";
import Image from "next/image";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { DownloadIcon, ClipboardCopyIcon } from "@radix-ui/react-icons";
import { GuardrailChip } from "./GuardrailChip";

export interface TranscriptProps {
  userText: string;
  setUserText: (val: string) => void;
  onSendMessage: () => void;
  canSend: boolean;
  downloadRecording: () => void;
}

function Transcript({
  userText,
  setUserText,
  onSendMessage,
  canSend,
  downloadRecording,
}: TranscriptProps) {
  const { transcriptItems, toggleTranscriptItemExpand } = useTranscript();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);
  const [justCopied, setJustCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function scrollToBottom() {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    const hasNewMessage = transcriptItems.length > prevLogs.length;
    const hasUpdatedMessage = transcriptItems.some((newItem, index) => {
      const oldItem = prevLogs[index];
      return (
        oldItem &&
        (newItem.title !== oldItem.title || newItem.data !== oldItem.data)
      );
    });

    if (hasNewMessage || hasUpdatedMessage) {
      scrollToBottom();
    }

    setPrevLogs(transcriptItems);
  }, [transcriptItems]);

  // Autofocus on text box input on load
  useEffect(() => {
    if (canSend && inputRef.current) {
      inputRef.current.focus();
    }
  }, [canSend]);

  const handleCopyTranscript = async () => {
    if (!transcriptRef.current) return;
    try {
      await navigator.clipboard.writeText(transcriptRef.current.innerText);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy transcript:", error);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{height:"96vh"}}>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Patient Registration</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyTranscript}
            className="p-1 text-gray-500 hover:text-gray-700"
            title={justCopied ? "Copied!" : "Copy transcript"}
          >
            <ClipboardCopyIcon className="w-4 h-4" />
          </button>
          <button
            onClick={downloadRecording}
            className="p-1 text-gray-500 hover:text-gray-700"
            title="Download audio recording"
          >
            <DownloadIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transcript Content */}
      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {[...transcriptItems]
          .sort((a, b) => a.createdAtMs - b.createdAtMs)
          .map((item) => {
            const {
              itemId,
              type,
              role,
              data,
              expanded,
              timestamp,
              title = "",
              isHidden,
              guardrailResult,
            } = item;

            if (isHidden) {
              return null;
            }

            if (type === "MESSAGE") {
              const isUser = role === "user";
              const containerClasses = `flex justify-end flex-col ${
                isUser ? "items-end" : "items-start"
              }`;
              const bubbleBase = `max-w-lg p-3 ${
                isUser ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-black"
              }`;
              const isBracketedMessage =
                title.startsWith("[") && title.endsWith("]");
              const messageStyle = isBracketedMessage
                ? 'italic text-gray-400'
                : '';
              const displayTitle = isBracketedMessage
                ? title.slice(1, -1)
                : title;

              return (
                <div key={itemId} className={containerClasses}>
                  <div className={`rounded-lg ${bubbleBase}`}>
                    <div className="text-xs opacity-60 mb-1">
                      {timestamp}
                    </div>
                    <ReactMarkdown className={messageStyle}>
                      {displayTitle}
                    </ReactMarkdown>
                    {guardrailResult && (
                      <div className="mt-2">
                        <GuardrailChip guardrailResult={guardrailResult} />
                      </div>
                    )}
                  </div>
                </div>
              );
            } else if (type === "BREADCRUMB") {
              return (
                <div key={itemId} className="flex items-center space-x-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                  <span className="text-xs text-gray-500">{timestamp}</span>
                  <span
                    className="text-sm cursor-pointer text-yellow-700 font-medium"
                    onClick={() => data && toggleTranscriptItemExpand(itemId)}
                  >
                    {data && (
                      <span className="inline-block w-4 transform transition-transform duration-200 mr-1">
                        ▶
                      </span>
                    )}
                    {title}
                  </span>
                  {expanded && data && (
                    <div className="mt-2">
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            } else {
              // Fallback if type is neither MESSAGE nor BREADCRUMB
              return (
                <div key={itemId} className="text-sm text-gray-500 italic p-2">
                  Unknown item type: {type}{" "}
                  <span className="text-xs">{timestamp}</span>
                </div>
              );
            }
          })}
      </div>

      <div className="border-t p-4 flex items-center space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSend) {
              onSendMessage();
            }
          }}
          className="flex-1 px-4 py-2 focus:outline-none"
          placeholder="Type a message..."
        />
        <button
          onClick={onSendMessage}
          disabled={!canSend || !userText.trim()}
          className={`px-4 py-2 rounded-md ${
            canSend && userText.trim()
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Transcript;
