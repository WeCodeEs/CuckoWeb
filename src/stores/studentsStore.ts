import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// 1. Interfaz actualizada para el Alumno
export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  faculty: string;
  created_at: string;
}

// 2. Estado actualizado para Alumnos
interface StudentState {
  alumnos: Student[];
  faculties: string[]; // Para el filtro de escuelas
  loading: boolean;
  error: string | null;
  searchTerm: string;
  facultyFilter: string; // 'Todos' o el nombre de una facultad
  fetchAlumnos: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setFacultyFilter: (faculty: string) => void;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  alumnos: [],
  faculties: [],
  loading: false,
  error: null,
  searchTerm: '',
  facultyFilter: 'Todos',

  // 3. Función de fetch modificada para Alumnos
  fetchAlumnos: async () => {
    try {
      set({ loading: true, error: null });
      
      console.log('Fetching students.');
      
      // Get current session (necesario para llamar a la Edge Function)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // 4. Se asume una nueva Edge Function 'list-student-users'
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-student-users`, {
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

      // Se asume que la función devuelve 'data' (alumnos) y 'faculties' (lista de escuelas)
      const { success, data, faculties, error } = await response.json();
      
      if (!success) {
        throw new Error(error?.message || 'No fue posible cargar los alumnos');
      }
      console.log('Received students:', data?.length || 0);
      
      // 5. Transformación de datos para el formato de Alumno
      const transformedStudents: Student[] = (data || []).map((user: any) => ({
        id: user.id,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        faculty: user.faculty || 'Sin escuela',
        created_at: user.created_at,
      }));

      console.log('Transformed students:', transformedStudents);
      
      set({ 
        alumnos: transformedStudents, 
        faculties: faculties || [], // Carga las facultades para el filtro
        loading: false 
      });
    } catch (error: any) {
      console.error('Error fetching students:', error);
      set({ 
        error: error.message || 'Error al cargar los alumnos',
        loading: false 
      });
    }
  },

  // 6. Setters para los filtros
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  setFacultyFilter: (faculty) => set({ facultyFilter: faculty }),
}));


// Se mantiene la función de parseo de errores, ya que se usa una Edge Function
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