import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getAccessToken, me, clearTokens, type AuthUser } from "../api/client";

type AuthContextValue = { user: AuthUser | null; loading: boolean; error: string; signOut: () => void };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(Boolean(getAccessToken()));
  const [error, setError] = useState("");
  useEffect(() => {
    if (!getAccessToken()) return;
    me().then(setUser).catch((err: Error) => { setError(err.message); clearTokens(); }).finally(() => setLoading(false));
  }, []);
  const value = useMemo(() => ({ user, loading, error, signOut: () => { clearTokens(); setUser(null); } }), [user, loading, error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth phải được dùng trong AuthProvider"); return context; }
