import { useMemo } from "react";
import { useAuth } from "@/auth/useAuth";
import { createGraphClient } from "@/services/graphClient";
import type { Client } from "@microsoft/microsoft-graph-client";

// Returns a memoized Graph API client scoped to the currently authenticated user.
// The client is re-created if the acquireToken function reference changes.
export function useGraphClient(): Client {
  const { acquireToken } = useAuth();
  return useMemo(() => createGraphClient(acquireToken), [acquireToken]);
}
