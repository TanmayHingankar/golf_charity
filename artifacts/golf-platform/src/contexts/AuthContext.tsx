import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  charityId: number | null;
  charityPercentage: number | null;
  subscriptionStatus: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token?: string | null) => void;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Bootstrap session from secure cookie by calling /auth/me
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("unauthenticated");
        const data = await res.json();
        setUser(data as User);
        setToken("cookie"); // marker token; real auth is via httpOnly cookie
      })
      .catch(() => {
        setUser(null);
        setToken(null);
      });
  }, []);

  const login = useCallback((user: User, token?: string | null) => {
    setUser(user);
    setToken(token ?? "cookie");
    localStorage.setItem("auth_user", JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_user");
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem("auth_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAdmin: user?.role === "admin",
      isAuthenticated: !!user,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
