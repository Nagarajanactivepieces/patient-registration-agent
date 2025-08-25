import React, { useState } from "react";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  ClockIcon,
} from "@radix-ui/react-icons";
import { GuardrailResultType } from "../types";

export interface ModerationChipProps {
  moderationCategory: string;
  moderationRationale: string;
}

function formatCategory(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function GuardrailChip({
  guardrailResult,
}: {
  guardrailResult: GuardrailResultType;
}) {
  const [expanded, setExpanded] = useState(false);

  // Consolidate state into a single variable: "PENDING", "PASS", or "FAIL"
  const state =
    guardrailResult.status === "IN_PROGRESS"
      ? "PENDING"
      : guardrailResult.category === "NONE"
      ? "PASS"
      : "FAIL";

  // Variables for icon, label, and styling classes based on state
  let IconComponent;
  let label: string;
  let textColorClass: string;
  switch (state) {
    case "PENDING":
      IconComponent = ClockIcon;
      label = "Pending";
      textColorClass = "text-gray-600";
      break;
    case "PASS":
      IconComponent = CheckCircledIcon;
      label = "Pass";
      textColorClass = "text-green-600";
      break;
    case "FAIL":
      IconComponent = CrossCircledIcon;
      label = "Fail";
      textColorClass = "text-red-500";
      break;
    default:
      IconComponent = ClockIcon;
      label = "Pending";
      textColorClass = "text-gray-600";
  }

  return (
    <div>
      <span
        onClick={() => {
          // Only allow toggling the expanded state for PASS/FAIL cases.
          if (state !== "PENDING") {
            setExpanded(!expanded);
          }
        }}
        // Only add pointer cursor if clickable (PASS or FAIL state)
        className={`inline-flex items-center gap-1 rounded ${
          state !== "PENDING" ? "cursor-pointer" : ""
        }`}
      >
        Guardrail:
        <IconComponent className={textColorClass} />
        <span className={textColorClass}>{label}</span>
      </span>
      {/* Container for expandable content */}
      {state !== "PENDING" && guardrailResult.category && guardrailResult.rationale && (
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
            **Moderation Category: {formatCategory(guardrailResult.category)}** <br />
            {guardrailResult.rationale}
            {guardrailResult.testText && (
              <blockquote className="mt-1 pl-2 border-l-2 border-gray-300 italic">
                {'>'} {guardrailResult.testText}
              </blockquote>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
