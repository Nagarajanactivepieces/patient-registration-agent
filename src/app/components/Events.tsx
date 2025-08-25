"use client";

import React, { useRef, useEffect, useState } from "react";
import { useEvent } from "@/app/contexts/EventContext";
import { LoggedEvent } from "@/app/types";

export interface EventsProps {
  isExpanded: boolean;
}

function Events({ isExpanded }: EventsProps) {
  const [prevEventLogs, setPrevEventLogs] = useState<LoggedEvent[]>([]);
  const eventLogsContainerRef = useRef<HTMLDivElement | null>(null);

  const { loggedEvents, toggleExpand } = useEvent();

  const getDirectionArrow = (direction: string) => {
    if (direction === "client") return { symbol: "▲", color: "#7f5af0" };
    if (direction === "server") return { symbol: "▼", color: "#2cb67d" };
    return { symbol: "•", color: "#555" };
  };

  useEffect(() => {
    const hasNewEvent = loggedEvents.length > prevEventLogs.length;

    if (isExpanded && hasNewEvent && eventLogsContainerRef.current) {
      eventLogsContainerRef.current.scrollTop =
        eventLogsContainerRef.current.scrollHeight;
    }

    setPrevEventLogs(loggedEvents);
  }, [loggedEvents, isExpanded]);

  return (
    <div>
      {isExpanded && (
        <div className="flex flex-col h-full" style={{height:"96vh"}}>
          <h3 className="text-lg font-semibold mb-4 text-center">
            Logs
          </h3>
          <div
            ref={eventLogsContainerRef}
            className="flex-1 overflow-y-auto space-y-2 text-xs"
          >
            {loggedEvents.map((log, idx) => {
              const arrowInfo = getDirectionArrow(log.direction);
              const isError =
                log.eventName.toLowerCase().includes("error") ||
                log.eventData?.response?.status_details?.error != null;

              return (
                <div
                  key={`${log.id}-${idx}`}
                  className={`p-2 rounded border ${
                    isError ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(log.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className={`font-bold ${
                          log.direction === "client"
                            ? "arrow-client"
                            : log.direction === "server"
                            ? "arrow-server"
                            : "arrow-default"
                        }`}
                      >
                        {arrowInfo.symbol}
                      </span>
                      <span className="font-medium text-black">
                        {log.eventName}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {log.timestamp}
                    </span>
                  </div>
                  {log.expanded && log.eventData && (
                    <div className="mt-2">
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(log.eventData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;
