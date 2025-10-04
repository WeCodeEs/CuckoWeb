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

interface UsuariosState {
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

export const useUsuariosStore = create<UsuariosState>((set, get) => ({
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
      
      console.log('🔍 Fetching users via Edge Function...');
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Call Edge Function to get all staff users
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/staff-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const { users } = await response.json();
      
      console.log('📊 Received users from Edge Function:', users?.length || 0);
      
      // Transform data to match expected format
      const transformedUsers: StaffUser[] = (users || []).map((user: any) => ({
        id: user.uuid,
        email: user.email || '',
        full_name: user.full_name || '',
        role: user.role || 'Sin perfil',
        active: user.active !== false,
        created_at: user.created_at,
        has_profile: !!(user.full_name && user.role)
      }));

      console.log('✅ Transformed users:', transformedUsers);
      
      set({ usuarios: transformedUsers, loading: false });
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      set({ 
        error: error.message || 'Error al cargar los usuarios',
        loading: false 
      });
    }
  },

  createUsuario: async (data: CreateStaffUserData) => {
    try {
      set({ loading: true, error: null });

      console.log('🔄 Creating user via Edge Function:', { email: data.email, full_name: data.full_name, role: data.role });

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Call Edge Function to create user
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/staff-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      console.log('✅ User created successfully');
      
      // Refresh the users list
      await get().fetchUsuarios();
      set({ isModalOpen: false });
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
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

      console.log('🔄 Updating user via Edge Function:', { id: data.id, email: data.email, full_name: data.full_name, role: data.role });

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Call Edge Function to update user
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/staff-users`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      console.log('✅ User updated successfully');
      
      // Refresh the users list
      await get().fetchUsuarios();
      set({ isModalOpen: false, selectedUser: null });
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
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

      console.log('🔄 Deleting user via Edge Function:', id);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Call Edge Function to delete user
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/staff-users?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      console.log('✅ User deleted successfully');
      
      // Refresh the users list
      await get().fetchUsuarios();
    } catch (error: any) {
      console.error('❌ Error deleting user:', error);
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