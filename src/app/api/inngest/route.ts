// app/api/inngest/route.ts

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { DeepsearchAgentFunction } from "@/inngest/deepSearch-Agent";
// Import both agent functions
import { codeAgentFunction } from "@/inngest/frontend-Agent";
import { dailyAgentFunction } from "@/inngest/daily-Agent";

console.log("📩 /api/inngest route loaded – waiting for POST event trigger");

//  Serve both functions using the App Router
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    codeAgentFunction,     // for "Web Generator"
    dailyAgentFunction,    // for "Daily Tasks" Q&A
    DeepsearchAgentFunction  // for write the long article
  ],
});
