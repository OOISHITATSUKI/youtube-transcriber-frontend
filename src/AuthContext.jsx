import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const jsonPayload = decodeURIComponent(
    atob(padded)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { email, name, userToken, credits }
  const [loading, setLoading] = useState(true);

  // Load saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem('yt_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        // Refresh credits from server
        refreshCredits(parsed.userToken);
      } catch {}
    }
    setLoading(false);
  }, []);

  const refreshCredits = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setUser(prev => {
          const updated = { ...prev, credits: data.credits };
          localStorage.setItem('yt_auth', JSON.stringify(updated));
          return updated;
        });
      }
    } catch {}
  };

  const handleGoogleResponse = async (response) => {
    if (!response.credential) return;

    try {
      // Decode JWT payload (Base64URL → Base64 → JSON)
      const payload = decodeJwtPayload(response.credential);

      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: response.credential,
          email: payload.email,
          name: payload.name,
          googleId: payload.sub,
        }),
      });

      if (!res.ok) throw new Error('Auth failed');

      const data = await res.json();
      const userData = {
        email: data.email,
        name: data.name || payload.name,
        userToken: data.userToken,
        credits: data.credits,
        picture: payload.picture,
      };

      setUser(userData);
      localStorage.setItem('yt_auth', JSON.stringify(userData));

      // Also store as yt_session for backward compatibility
      localStorage.setItem('yt_session', JSON.stringify({
        token: data.userToken,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      // Immediately clean up GSI UI elements after login
      try { window.google?.accounts?.id?.cancel(); } catch {}
      document.querySelectorAll(
        '[id^="credential_picker"], [id^="g_id_"], iframe[src*="accounts.google.com"], .g_id_signin, div[style*="accounts.google.com"]'
      ).forEach(el => el.remove());
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('yt_auth');
    localStorage.removeItem('yt_session');
    // Revoke Google session so button re-appears
    try { window.google?.accounts?.id?.disableAutoSelect(); } catch {}
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      handleGoogleResponse,
      logout,
      refreshCredits: () => user?.userToken && refreshCredits(user.userToken),
      isLoggedIn: !!user,
      isPaid: user?.credits > 0,
      sessionToken: user?.userToken || null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
