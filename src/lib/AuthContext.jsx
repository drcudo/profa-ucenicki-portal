import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

const TEST_USER = {
  id: 'test-user-1',
  email: 'test.ucenik@profa.com.hr',
  name: 'Testni korisnik',
  role: 'admin', // privremeno za pregled svih ekrana i opcija
  pozvan: true,
  razina: 'A',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(TEST_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(true);
  const [appPublicSettings] = useState({ id: 'local-test', public_settings: {} });

  const checkAppState = async () => {};
  const checkUserAuth = async () => {};

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    window.location.href = '/dashboard';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};