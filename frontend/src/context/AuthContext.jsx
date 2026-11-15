import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextDef';
import { loginUser, registerUser, fetchCurrentUser } from '../api/client';
import {
  readStorage,
  readMathStorage,
  pullProgressFromServer,
  syncProgressToServer,
} from '../services/roadmapProgressService';

const TOKEN_KEY = 'ailu_auth_token';
const USER_KEY = 'ailu_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [authModalState, setAuthModalState] = useState({ isOpen: false, tab: 'login', message: '' });

  // Validate token on mount
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchCurrentUser(token).then((res) => {
      if (cancelled) return;
      if (res && res.userId) {
        setUser(res);
        localStorage.setItem(USER_KEY, JSON.stringify(res));
      } else {
        // Token expired/invalid
        setToken('');
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const openAuthModal = useCallback((tab = 'login', message = '') => {
    setAuthModalState({ isOpen: true, tab, message });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalState((s) => ({ ...s, isOpen: false }));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginUser({ email, password });
    if (res && res.user && res.token) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      localStorage.setItem(TOKEN_KEY, res.token);
      closeAuthModal();

      // Pull user's saved cloud progress from backend
      await pullProgressFromServer();
      // Sync any local progress back to cloud for this account
      syncProgressToServer();
      return res.user;
    }
    throw new Error('Login failed: invalid response from server.');
  }, [closeAuthModal]);

  const register = useCallback(
    async (email, password, displayName, transferGuestProgress = true) => {
      const guestProgress = transferGuestProgress ? readStorage() : {};
      const guestMathProgress = transferGuestProgress ? readMathStorage() : {};

      const res = await registerUser({
        email,
        password,
        displayName,
        guestProgress,
        guestMathProgress,
      });

      if (res && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        localStorage.setItem(TOKEN_KEY, res.token);
        closeAuthModal();

        // Pull latest merged progress
        await pullProgressFromServer();
        return res;
      }
      throw new Error('Registration failed: invalid response from server.');
    },
    [closeAuthModal]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken('');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const continueAsGuest = useCallback(() => {
    closeAuthModal();
  }, [closeAuthModal]);

  const isGuest = !user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        token,
        authModalState,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
