// It creates a type-safe React hook to handle realtime communication.

"use client"

import { createRealtime } from "@upstash/realtime/client"
import type { RealtimeEvents } from "./realtime"

export const { useRealtime } = createRealtime<RealtimeEvents>()  //creates a type-safe realtime hook for your app