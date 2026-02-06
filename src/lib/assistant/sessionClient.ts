/** Client-side session API helpers (create, load). */

export async function createSession(params?: {
  userId?: string;
  target?: { role?: string; country?: string };
  sessionId?: string;
}) {
  const r = await fetch("/api/session/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params ?? {}),
  });
  if (!r.ok) return null;
  return r.json() as Promise<{
    ok: true;
    session: {
      sessionId: string;
      cv: Record<string, unknown>;
      filledKeys: string[];
      completed: boolean;
      createdAt: string;
      updatedAt: string;
    };
  }>;
}

export async function loadSession(sessionId: string, userId?: string) {
  const r = await fetch("/api/session/load", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, userId }),
  });
  if (!r.ok) return null;
  return r.json() as Promise<{
    ok: true;
    session: {
      sessionId: string;
      userId: string | null;
      cv: Record<string, unknown>;
      filledKeys: string[];
      completed: boolean;
      completedAt: string | null;
      updatedAt: string;
      createdAt: string;
    };
  }>;
}

export async function resetSession(sessionId: string, userId?: string) {
  const r = await fetch("/api/session/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, userId }),
  });
  if (!r.ok) return null;
  return r.json() as Promise<{ ok: true; sessionId: string }>;
}
