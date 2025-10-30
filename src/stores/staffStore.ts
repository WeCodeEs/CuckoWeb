import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface StaffUser {
  id: string;
  full_name: string;
  email: string;
  role: 'Administrador' | 'Operador';
  active: boolean;
  created_at: string;
  has_profile?: boolean;
}

interface CreateStaffUserData {
  email: string;
  password: string;
  full_name: string;
  role: 'Administrador' | 'Operador';
  active: boolean;
}

interface UpdateStaffUserData {
  id: string;
  email?: string;
  password?: string;
  full_name?: string;
  role?: 'Administrador' | 'Operador';
  active?: boolean;
}

interface StaffState {
  usuarios: StaffUser[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  roleFilter: 'Todos' | 'Administrador' | 'Operador';
  selectedUser: StaffUser | null;
  isModalOpen: boolean;
  fetchUsuarios: () => Promise<void>;
  createUsuario: (data: CreateStaffUserData) => Promise<void>;
  updateUsuario: (data: UpdateStaffUserData) => Promise<void>;
  deleteUsuario: (id: string) => Promise<void>;
  setSearchTerm: (term: string) => void;
  setRoleFilter: (role: 'Todos' | 'Administrador' | 'Operador') => void;
  setSelectedUser: (user: StaffUser | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  usuarios: [],
  loading: false,
  error: null,
  searchTerm: '',
  roleFilter: 'Todos',
  selectedUser: null,
  isModalOpen: false,

  fetchUsuarios: async () => {
    try {
      set({ loading: true, error: null });
      
      console.log('Fetching users.');
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Call Edge Function to get all staff users
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-staff-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err?.error?.message || err?.error || `HTTP ${response.status}`;
        throw new Error(msg);
      }

      const { success, data, error } = await response.json();
      
      if (!success) {
        throw new Error(error?.message || 'No fue posible cargar los usuarios');
      }
      console.log('Received users:', data?.length || 0);
      
      // Transform data to match expected format
      const transformedUsers: StaffUser[] = (data || []).map((user: any) => ({
        id: user.id,
        email: user.email || '',
        full_name: user.full_name || '',
        role: user.role || 'Sin perfil',
        active: user.active !== false,
        created_at: user.created_at,
        has_profile: !!(user.full_name && user.role)
      }));

      console.log('Transformed users:', transformedUsers);
      
      set({ usuarios: transformedUsers, loading: false });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      set({ 
        error: error.message || 'Error al cargar los usuarios',
        loading: false 
      });
    }
  },

  createUsuario: async (data: CreateStaffUserData) => {
    try {
      set({ loading: true, error: null });

      console.log('Creating user:', { email: data.email, full_name: data.full_name, role: data.role });

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Call Edge Function to create user
      const { data: response, error: invokeError } = await supabase.functions.invoke('create-staff-user', {
        method: 'POST',
        body: data,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (invokeError) {
        const msg = await parseEdgeError(invokeError);
        console.error('Error creating new user:', msg);
        throw new Error(msg || 'Error al crear usuario');
      }

      if (!response?.success) {
        const msg = response?.error?.message || 'No fue posible crear el usuario';
        throw new Error(msg);
      }

      console.log('User created successfully', response.data);
      
      // Refresh the users list
      await get().fetchUsuarios();
      set({ isModalOpen: false });
    } catch (error: any) {
      console.error('Error creating user:', error);
      set({ 
        error: error.message || 'Error al crear el usuario',
        loading: false 
      });
      throw error;
    }
  },

  updateUsuario: async (data: UpdateStaffUserData) => {
    try {
      set({ loading: true, error: null });

      console.log('Updating user:', { id: data.id, email: data.email, full_name: data.full_name, role: data.role });

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      const { data: response, error: invokeError } = await supabase.functions.invoke('update-staff-user', {
        method: 'PATCH',
        body: data,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (invokeError) {
        const msg = await parseEdgeError(invokeError);
        console.error('Error updating user:', msg);
        throw new Error(msg || 'Error al actualizar usuario');
      }

      if (!response?.success) {
        const msg = response?.error?.message || 'No fue posible actualizar el usuario';
        throw new Error(msg);
      }

      console.log('User updated successfully.', response.data);
      
      // Refresh the users list
      await get().fetchUsuarios();
      set({ isModalOpen: false, selectedUser: null });
    } catch (error: any) {
      console.error('Error updating user:', error);
      set({ 
        error: error.message || 'Error al actualizar el usuario',
        loading: false 
      });
      throw error;
    }
  },

  deleteUsuario: async (id: string) => {
    try {
      set({ loading: true, error: null });

      console.log('Deleting user:', id);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Call Edge Function to delete user
      const { data: response, error: invokeError } = await supabase.functions.invoke('delete-staff-user', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (invokeError) {
        const msg = await parseEdgeError(invokeError);
        console.error('Error deleting user:', msg);
        throw new Error(msg || 'Error al eliminar usuario');
      }

      if (!response?.success) {
        const msg = response?.error?.message || 'No fue posible eliminar el usuario';
        throw new Error(msg);
      }

      console.log('User deleted successfully.', response.data);
      
      // Refresh the users list
      await get().fetchUsuarios();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      set({ 
        error: error.message || 'Error al eliminar el usuario',
        loading: false 
      });
      throw error;
    }
  },

  setSearchTerm: (term: string) => set({ searchTerm: term }),
  setRoleFilter: (role) => set({ roleFilter: role }),
  setSelectedUser: (user) => set({ selectedUser: user }),
  setIsModalOpen: (isOpen) => {
    set({ isModalOpen: isOpen });
    if (!isOpen) {
      set({ selectedUser: null });
    }
  },
}));


// Parsea el error de una Edge Function 
export async function parseEdgeError(invokeError: any): Promise<string> {
  let fallbackMessage = invokeError?.message || 'Error al ejecutar la función';

  try {
    const res = await invokeError.context.json();
    return res?.error?.message ?? res?.message ?? fallbackMessage;
  } catch (e) {
    console.warn('No se pudo leer el body del error:', e);
  }

  return fallbackMessage;
}