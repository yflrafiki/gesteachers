import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { loginUser } from '../api/auth';
import { type User } from '../types/index';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setSession: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    const savedToken = sessionStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await loginUser({ email, password });
    const { token, user } = res.data;

    if (user.role !== 'teacher') {
      throw new Error('This portal is for teachers only');
    }

    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  // Used after code verification, which returns a token+user directly —
  // avoids a second round-trip through login().
  const setSession = (token: string, user: User) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);