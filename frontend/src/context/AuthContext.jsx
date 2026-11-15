import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextDef';
import {
  loginUser,
  registerUser,
  forgotPassword as apiForgotPassword,
  verifyOTP as apiVerifyOTP,
  resetPassword as apiResetPassword,
  logoutUser,
  fetchCurrentUser,
} from '../api/client';
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
  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    tab: 'login',
    message: '',
    initialData: {},
  });

  // Validate session on mount
  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser(token).then((res) => {
      if (cancelled) return;
      if (res && res.userId) {
        setUser(res);
        localStorage.setItem(USER_KEY, JSON.stringify(res));
      } else if (token) {
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

  const openAuthModal = useCallback((tab = 'login', message = '', initialData = {}) => {
    setAuthModalState({ isOpen: true, tab, message, initialData });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalState((s) => ({ ...s, isOpen: false }));
  }, []);

  const login = useCallback(
    async (identifierOrEmail, password) => {
      const res = await loginUser({ identifier: identifierOrEmail, password });
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
    },
    [closeAuthModal]
  );

  const register = useCallback(
    async (arg1, password, displayName, transferGuestProgress = true) => {
      let regData = {};
      if (typeof arg1 === 'object' && arg1 !== null) {
        // Called with config object
        const transfer = arg1.transferGuestProgress !== false;
        regData = {
          fullName: arg1.fullName || arg1.displayName || arg1.username,
          username: arg1.username,
          email: arg1.email,
          password: arg1.password,
          confirmPassword: arg1.confirmPassword,
          displayName: arg1.displayName || arg1.fullName || arg1.username,
          guestProgress: transfer ? readStorage() : {},
          guestMathProgress: transfer ? readMathStorage() : {},
        };
      } else {
        // Legacy positional call
        const email = arg1;
        regData = {
          fullName: displayName || email.split('@')[0],
          username: email.split('@')[0],
          email,
          password,
          confirmPassword: password,
          displayName: displayName || email.split('@')[0],
          guestProgress: transferGuestProgress ? readStorage() : {},
          guestMathProgress: transferGuestProgress ? readMathStorage() : {},
        };
      }

      const res = await registerUser(regData);

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

  const forgotPassword = useCallback(async (email) => {
    return apiForgotPassword({ email });
  }, []);

  const verifyOTP = useCallback(async (email, otp) => {
    return apiVerifyOTP({ email, otp });
  }, []);

  const resetPassword = useCallback(async (resetToken, newPassword, confirmPassword) => {
    return apiResetPassword({ resetToken, newPassword, confirmPassword });
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser(token);
    } catch {
      // Continue client-side clear even if network fails
    }
    setUser(null);
    setToken('');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, [token]);

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
        forgotPassword,
        verifyOTP,
        resetPassword,
        logout,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
