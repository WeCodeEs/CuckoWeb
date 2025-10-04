import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type StaffUser = Database['public']['Tables']['staff_users']['Row'];

interface AuthState {
  session: any | null;
  user: StaffUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUser: () => Promise<void>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async <T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (retries === 0 || error.message.includes('Invalid login credentials')) {
      throw error;
    }
    await delay(delayMs);
    return retryOperation(operation, retries - 1, delayMs);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: false,
  error: null,

  signUp: async (email: string, password: string, fullName: string) => {
    try {
      set({ loading: true, error: null });

      const signUpOperation = async () => {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          if (signUpError.message === 'User already registered') {
            throw new Error('Este correo electrónico ya está registrado. Por favor inicia sesión.');
          }
          throw signUpError;
        }

        if (!authData.user) {
          throw new Error('No se pudo crear el usuario');
        }

        const { error: staffError } = await supabase
          .from('staff_users')
          .insert([
            {
              uuid: authData.user.id,
              email,
              full_name: fullName,
              role: 'Operador',
            },
          ])
          .select()
          .single();

        if (staffError) {
          throw new Error('Error al crear el perfil de personal');
        }

        return authData;
      };

      await retryOperation(signUpOperation);
      set({ loading: false, error: null });
    } catch (error: any) {
      set({ 
        loading: false,
        error: error.message || 'Error durante el registro'
      });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      
      const signInOperation = async () => {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message === 'Invalid login credentials') {
            throw new Error('Credenciales inválidas. Por favor verifica tu correo y contraseña.');
          }
          throw signInError;
        }

        if (!authData.user) {
          throw new Error('No se encontró información del usuario');
        }

        const { data: userData, error: userError } = await supabase
          .from('staff_users')
          .select('*')
          .eq('uuid', authData.user.id)
          .maybeSingle();

        if (userError) {
          throw new Error('Error al obtener datos del personal');
        }

        if (!userData) {
          await supabase.auth.signOut();
          throw new Error('No se encontró un registro de personal asociado a esta cuenta. Por favor contacte al administrador.');
        }

        return { session: authData.session, user: userData };
      };

      const { session, user } = await retryOperation(signInOperation);
      set({ 
        session,
        user,
        loading: false,
        error: null 
      });
    } catch (error: any) {
      const errorMessage = error.message === 'Failed to fetch'
        ? 'Error de conexión. Por favor verifica tu conexión a internet.'
        : error.message || 'Error al iniciar sesión';

      set({ 
        session: null,
        user: null,
        loading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        // Don't throw error for sign out - just clear local state
      }
      
      set({ 
        session: null,
        user: null,
        loading: false,
        error: null 
      });
      
      // Force page reload to clear any cached state
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if there's an error, clear the local state and redirect
      set({ 
        session: null,
        user: null,
        loading: false,
        error: null
      });
      window.location.href = '/login';
    }
  },

  getUser: async () => {
    try {
      set({ loading: true, error: null });

      const getUserOperation = async () => {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (!session) {
          return { session: null, user: null };
        }

        const { data: userData, error: userError } = await supabase
          .from('staff_users')
          .select('*')
          .eq('uuid', session.user.id)
          .maybeSingle();

        if (userError) {
          throw new Error('Error al obtener datos del personal');
        }

        if (!userData) {
          await supabase.auth.signOut();
          throw new Error('No se encontró un registro de personal asociado a esta cuenta. Por favor contacte al administrador.');
        }

        return { session, user: userData };
      };

      const { session, user } = await retryOperation(getUserOperation);
      set({ 
        session,
        user,
        loading: false,
        error: null 
      });
    } catch (error: any) {
      const errorMessage = error.message === 'Failed to fetch'
        ? 'Error de conexión. Por favor verifica tu conexión a internet.'
        : error.message || 'Error al obtener datos del usuario';

      set({ 
        session: null,
        user: null,
        loading: false,
        error: errorMessage
      });
      throw error;
    }
  },
}));