import { createContext, useContext } from "react";

export type AuthContextType = {
  isAuthenticated: boolean;
  username?: string;
  displayName?: string;
  email?: string;
  login: () => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
