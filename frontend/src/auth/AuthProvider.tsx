import { createContext, useContext, useEffect, useState } from "react";
import keycloak from "./keycloak";

type AuthContextType = {
  isAuthenticated: boolean;
  username?: string;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    keycloak.authenticated ?? false
  );

  useEffect(() => {
    setIsAuthenticated(keycloak.authenticated ?? false);
  }, []);

  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout();
  };

  const username = keycloak.tokenParsed?.preferred_username;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}