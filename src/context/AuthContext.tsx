import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types/auth';
import { AuthService } from '../services/authService';
import { supabase } from '../lib/supabase';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  updateProfile: (updates: { name?: string; avatarUrl?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Initial user fetch
    const initAuth = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        setState(prev => ({ ...prev, user, isLoading: false }));
      } catch (error) {
        console.error("Initial Auth Check Failed:", error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: (error as Error).message || "Configuration error. Please check browser console." 
        }));
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setState({
          user: {
            id: session.user.id,
            email: session.user.email!,
            isVerified: true,
            createdAt: new Date(session.user.created_at).getTime(),
            name: session.user.user_metadata?.full_name,
            avatarUrl: session.user.user_metadata?.avatar_url,
          },
          isLoading: false,
          error: null,
        });
      } else {
        setState({ user: null, isLoading: false, error: null });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await AuthService.login(email, password);
      setState({ user, isLoading: false, error: null });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await AuthService.signup(email, password);
      setState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
      throw error;
    }
  };

  const verifyOTP = async (email: string, code: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await AuthService.verifyOTP(email, code);
      setState({ user, isLoading: false, error: null });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await AuthService.forgotPassword(email);
      setState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
      throw error;
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await AuthService.resetPassword(email, code, newPassword);
      setState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
      throw error;
    }
  };

  const updateProfile = async (updates: { name?: string; avatarUrl?: string }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await AuthService.updateProfile(updates);
      const user = await AuthService.getCurrentUser();
      setState(prev => ({ ...prev, user, isLoading: false, error: null }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setState({ user: null, isLoading: false, error: null });
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, verifyOTP, forgotPassword, resetPassword, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
