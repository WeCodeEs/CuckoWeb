export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      staff_users: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'Administrador' | 'Operador'
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          password: string
          role?: 'Administrador' | 'Operador'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          password?: string
          role?: 'Administrador' | 'Operador'
          created_at?: string
        }
      }
    }
  }
}