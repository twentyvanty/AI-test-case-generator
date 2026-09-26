import keycloak from "./keycloak";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // keycloak.init() finishes before the app renders (see main.tsx),
  // and login/logout redirect the whole page, so this value is always current.
  const isAuthenticated = keycloak.authenticated ?? false;

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
