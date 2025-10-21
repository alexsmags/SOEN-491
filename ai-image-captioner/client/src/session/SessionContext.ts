import { createContext } from "react";

export type SessionUser =
  | { id?: string; name?: string | null; email?: string | null }
  | null;

export type SessionCtx = {
  user: SessionUser;
  loading: boolean;
  refresh: () => Promise<void>;
};

export const SessionContext = createContext<SessionCtx>({
  user: null,
  loading: true,
  refresh: async () => {},
});
