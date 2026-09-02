import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('swims_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('swims_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('swims_token');
      const savedUserStr = localStorage.getItem('swims_user');
      if (savedToken && savedToken === 'demo-token-jwt' && savedUserStr) {
        setUser(JSON.parse(savedUserStr));
        setIsLoading(false);
        return;
      }
      if (savedToken) {
        try {
          const currentUser = await authApi.getMe();
          setUser(currentUser);
          localStorage.setItem('swims_user', JSON.stringify(currentUser));
        } catch {
          if (savedUserStr) {
            setUser(JSON.parse(savedUserStr));
          } else {
            localStorage.removeItem('swims_token');
            localStorage.removeItem('swims_user');
            setToken(null);
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res: AuthResponse = await authApi.login({ email, password });
      setToken(res.accessToken);
      setUser(res.user);
      localStorage.setItem('swims_token', res.accessToken);
      localStorage.setItem('swims_user', JSON.stringify(res.user));
      toast.success(`Selamat datang kembali, ${res.user.fullName}!`);
    } catch (err: any) {
      if (!err.response && email.includes('@smartwarehouse.com')) {
        // Offline demo account fallback
        const role = email.includes('admin')
          ? { code: 'ROLE_ADMIN', name: 'Super Admin' }
          : (email.includes('manager')
              ? { code: 'ROLE_MANAGER', name: 'Warehouse Manager' }
              : (email.includes('purchasing')
                  ? { code: 'ROLE_PURCHASING', name: 'Purchasing Officer' }
                  : { code: 'ROLE_STAFF', name: 'Warehouse Staff' }));

        const name = email.includes('admin')
          ? 'Fajar Sidik'
          : (email.includes('manager')
              ? 'Budi Santoso'
              : (email.includes('purchasing')
                  ? 'Dewi Lestari'
                  : 'Ahmad Fauzi'));

        const demoUser: User = {
          id: email.includes('admin') ? 1 : (email.includes('manager') ? 2 : (email.includes('purchasing') ? 5 : 8)),
          email,
          fullName: `${name} (${role.name})`,
          role: role.name,
          roleCode: role.code,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=946D6D&color=fff&bold=true`
        };
        setToken('demo-token-jwt');
        setUser(demoUser);
        localStorage.setItem('swims_token', 'demo-token-jwt');
        localStorage.setItem('swims_user', JSON.stringify(demoUser));
        toast.success(`Selamat datang di InvWare, ${demoUser.fullName}!`);
        return;
      }

      const msg = err.response?.data?.message || 'Gagal melakukan login. Periksa email dan kata sandi Anda.';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      await authApi.register(payload);
      toast.success('Pendaftaran akun berhasil! Silakan masuk dengan akun Anda.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal mendaftarkan akun.';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore error
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('swims_token');
      localStorage.removeItem('swims_user');
      toast.info('Anda telah keluar dari sesi.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        setUser
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
