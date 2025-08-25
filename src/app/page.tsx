import React, { Suspense } from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App from "./App";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventProvider>
        <TranscriptProvider>
          <App />
        </TranscriptProvider>
      </EventProvider>
    </Suspense>
  );
}
