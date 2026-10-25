"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth.api";
import {
  getTokens,
  onSessionChange,
  removeLegacyTokens,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from "../api/auth";
import { ApiError } from "../api/errors";

type AuthState = {
  status: "loading" | "authenticated" | "anonymous" | "error";
  user: AuthUser | null;
  error: string;
};
type AuthContextValue = AuthState & {
  signIn: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
  restore: () => Promise<void>;
};
const Context = createContext<AuthContextValue | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
    error: "",
  });
  const attempt = useRef(0);
  const restore = useCallback(async () => {
    const current = ++attempt.current;
    setState({ status: "loading", user: null, error: "" });
    try {
      removeLegacyTokens();
      if (!getTokens()) {
        setState({ status: "anonymous", user: null, error: "" });
        return;
      }
      const user = await authApi.me();
      if (current === attempt.current && getTokens())
        setState({ status: "authenticated", user, error: "" });
    } catch (error) {
      if (current !== attempt.current) return;
      const expired = error instanceof ApiError && error.status === 401;
      setState({
        status: expired ? "anonymous" : "error",
        user: null,
        error:
          error instanceof Error ? error.message : "Không thể xác minh phiên.",
      });
    }
  }, []);
  useEffect(() => {
    // One startup call, even under React StrictMode effect replay.
    let active = true;
    const timer = setTimeout(() => {
      if (active) void restore();
    }, 0);
    const unsubscribe = onSessionChange(() => {
      if (!getTokens()) {
        ++attempt.current;
        setState({ status: "anonymous", user: null, error: "" });
      }
    });
    return () => {
      active = false;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [restore]);
  const signIn = async (payload: LoginPayload) => {
    const current = ++attempt.current;
    const user = await authApi.login(payload);
    if (current === attempt.current)
      setState({ status: "authenticated", user, error: "" });
  };
  const signUp = async (payload: RegisterPayload) => {
    const current = ++attempt.current;
    const user = await authApi.register(payload);
    if (current === attempt.current)
      setState({ status: "authenticated", user, error: "" });
  };
  const signOut = async () => {
    ++attempt.current;
    setState({ status: "anonymous", user: null, error: "" });
    await authApi.logout();
  };
  const value = useMemo(
    () => ({ ...state, signIn, signUp, signOut, restore }),
    [state, restore],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider không có trong cây component.");
  return value;
}
