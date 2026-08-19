"use client";

import { getGreeting } from "@/lib/utils";

/**
 * The dashboard is server-rendered, where `getGreeting()` reads the SERVER's
 * clock — deployed to another timezone, that says "Good Morning" at 8 PM.
 * Rendering the word in a client component makes hydration recompute it from
 * the user's local clock (client value wins on text mismatch); the
 * suppressed warning is that expected server/client difference.
 */
export function Greeting() {
  return <span suppressHydrationWarning>{getGreeting()}</span>;
}
