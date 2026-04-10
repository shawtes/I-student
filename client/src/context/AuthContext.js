import { createContext, useState, useContext, useEffect } from 'react';
import { signIn, signUp, signOut, confirmSignUp, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Dev login bypass: if localStorage has a devUser, use it as-is and skip
    // the entire Cognito round trip. This is how the /dev-login page works.
    const devUser = localStorage.getItem('devUser');
    if (devUser) {
      try {
        setUser(JSON.parse(devUser));
      } catch {
        localStorage.removeItem('devUser');
      }
      setLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (token) {
        localStorage.setItem('token', token);
      }
      // try to get user profile from our backend
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch {
        // user exists in Cognito but not in our DB yet - set basic info
        setUser({
          email: currentUser.signInDetails?.loginId || currentUser.username,
          role: 'student'
        });
      }
    } catch {
      // not signed in
      localStorage.removeItem('token');
    }
    setLoading(false);
  };

  const devLogin = (role) => {
    const fake = {
      email: `${role}@local.test`,
      name: role.charAt(0).toUpperCase() + role.slice(1) + ' User',
      role,
      cognitoId: 'dev-' + role
    };
    localStorage.setItem('devUser', JSON.stringify(fake));
    setUser(fake);
    return fake;
  };

  const login = async (email, password) => {
    try { await signOut(); } catch {}
    const result = await signIn({ username: email, password });
    console.log('signIn result:', JSON.stringify(result));
    if (result.isSignedIn) {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      localStorage.setItem('token', token);
      // get or create user in our backend
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
        return response.data;
      } catch {
        const userData = { email, role: 'student' };
        setUser(userData);
        return userData;
      }
    }
    if (result.nextStep) {
      throw new Error(`Sign-in requires: ${result.nextStep.signInStep}`);
    }
    return result;
  };

  const register = async (email, password, name) => {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: { email, name }
      }
    });
    return result;
  };

  const confirmAccount = async (email, code) => {
    await confirmSignUp({ username: email, confirmationCode: code });
  };

  const logout = async () => {
    const wasDev = localStorage.getItem('devUser');
    localStorage.removeItem('devUser');
    localStorage.removeItem('token');
    if (!wasDev) {
      try { await signOut(); } catch {}
    }
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    confirmAccount,
    logout,
    devLogin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
