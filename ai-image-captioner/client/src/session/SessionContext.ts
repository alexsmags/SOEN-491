import { createContext } from "react";

export type SessionUser =
  | { id?: string; name?: string | null; email?: string | null }
  | null;

export type SessionCtx = {
  user: SessionUser;
  loading: boolean;   // true only during the very first load
  hydrated: boolean;  // becomes true right after first load completes (success or fail)
  refresh: (opts?: { blocking?: boolean }) => Promise<void>;
};

export const SessionContext = createContext<SessionCtx>({
  user: null,
  loading: true,
  hydrated: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  refresh: async () => {},
});
