export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          active: boolean
          banner_action: Database["public"]["Enums"]["banner_action"]
          created_at: string
          id: number
          image_url: string
          menu_id: number | null
          product_id: number | null
          sort_order: number
          store_details_id: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          banner_action?: Database["public"]["Enums"]["banner_action"]
          created_at?: string
          id?: number
          image_url: string
          menu_id?: number | null
          product_id?: number | null
          sort_order: number
          store_details_id: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          banner_action?: Database["public"]["Enums"]["banner_action"]
          created_at?: string
          id?: number
          image_url?: string
          menu_id?: number | null
          product_id?: number | null
          sort_order?: number
          store_details_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banners_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banners_store_details_id_fkey"
            columns: ["store_details_id"]
            isOneToOne: false
            referencedRelation: "store_details"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: number
          menu_id: number
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: number
          menu_id: number
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: number
          menu_id?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      change_logs: {
        Row: {
          action: string
          change_timestamp: string
          details: Json
          id: number
          record_id: string
          staff_uuid: string | null
          table_name: string
        }
        Insert: {
          action: string
          change_timestamp?: string
          details?: Json
          id?: number
          record_id: string
          staff_uuid?: string | null
          table_name: string
        }
        Update: {
          action?: string
          change_timestamp?: string
          details?: Json
          id?: number
          record_id?: string
          staff_uuid?: string | null
          table_name?: string
        }
        Relationships: []
      }
      menus: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon_name: string
          id: number
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon_name: string
          id?: number
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: number
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          message: string
          order_id: number | null
          title: string
          type: Database["public"]["Enums"]["notification_type_enum"]
          user_uuid: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          message: string
          order_id?: number | null
          title: string
          type: Database["public"]["Enums"]["notification_type_enum"]
          user_uuid?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          message?: string
          order_id?: number | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type_enum"]
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["uuid"]
          },
        ]
      }
      option_groups: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: number
          max_select: number
          min_select: number
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: number
          max_select?: number
          min_select?: number
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: number
          max_select?: number
          min_select?: number
          name?: string
        }
        Relationships: []
      }
      options: {
        Row: {
          active: boolean | null
          additional_price: number
          id: number
          name: string
          option_group_id: number
        }
        Insert: {
          active?: boolean | null
          additional_price?: number
          id?: number
          name: string
          option_group_id: number
        }
        Update: {
          active?: boolean | null
          additional_price?: number
          id?: number
          name?: string
          option_group_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "customization_options_customization_id_fkey"
            columns: ["option_group_id"]
            isOneToOne: false
            referencedRelation: "option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      order_details: {
        Row: {
          created_at: string
          id: number
          order_id: number
          product_id: number | null
          product_image_url: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: number
          order_id: number
          product_id?: number | null
          product_image_url?: string | null
          product_name?: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: number
          order_id?: number
          product_id?: number | null
          product_image_url?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_options: {
        Row: {
          id: number
          option_group_name: string
          option_id: number | null
          option_name: string
          order_detail_id: number
          price_at_moment: number
          product_option_group_option_id: number | null
          quantity: number
        }
        Insert: {
          id?: number
          option_group_name?: string
          option_id?: number | null
          option_name?: string
          order_detail_id: number
          price_at_moment?: number
          product_option_group_option_id?: number | null
          quantity?: number
        }
        Update: {
          id?: number
          option_group_name?: string
          option_id?: number | null
          option_name?: string
          order_detail_id?: number
          price_at_moment?: number
          product_option_group_option_id?: number | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_detail_options_order_detail_id_fkey"
            columns: ["order_detail_id"]
            isOneToOne: false
            referencedRelation: "order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_options_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivered_at: string | null
          display_number: number | null
          id: number
          is_takeaway: boolean
          payment_status:
            | Database["public"]["Enums"]["payment_status_enum"]
            | null
          ready_at: string | null
          scheduled_delivery_time: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["order_status_enum"]
          stripe_payment_intent_id: string | null
          total: number
          updated_at: string
          user_uuid: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          display_number?: number | null
          id?: number
          is_takeaway?: boolean
          payment_status?:
            | Database["public"]["Enums"]["payment_status_enum"]
            | null
          ready_at?: string | null
          scheduled_delivery_time?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["order_status_enum"]
          stripe_payment_intent_id?: string | null
          total: number
          updated_at?: string
          user_uuid: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          display_number?: number | null
          id?: number
          is_takeaway?: boolean
          payment_status?:
            | Database["public"]["Enums"]["payment_status_enum"]
            | null
          ready_at?: string | null
          scheduled_delivery_time?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["order_status_enum"]
          stripe_payment_intent_id?: string | null
          total?: number
          updated_at?: string
          user_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["uuid"]
          },
        ]
      }
      product_option_group_options: {
        Row: {
          active: boolean
          additional_price: number | null
          id: number
          option_id: number
          product_option_group_id: number
        }
        Insert: {
          active?: boolean
          additional_price?: number | null
          id?: never
          option_id: number
          product_option_group_id: number
        }
        Update: {
          active?: boolean
          additional_price?: number | null
          id?: never
          option_id?: number
          product_option_group_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_customization_options_product_customization_id_fkey"
            columns: ["product_option_group_id"]
            isOneToOne: false
            referencedRelation: "product_option_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_option_group_options_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_groups: {
        Row: {
          id: number
          option_group_id: number
          product_id: number
          sort_order: number | null
        }
        Insert: {
          id?: number
          option_group_id: number
          product_id: number
          sort_order?: number | null
        }
        Update: {
          id?: number
          option_group_id?: number
          product_id?: number
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_customizations_customization_id_fkey"
            columns: ["option_group_id"]
            isOneToOne: false
            referencedRelation: "option_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_option_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          base_price: number
          category_id: number
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price: number
          category_id: number
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          category_id?: number
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          expo_push_token: string
          updated_at: string
          user_uuid: string
        }
        Insert: {
          expo_push_token: string
          updated_at?: string
          user_uuid: string
        }
        Update: {
          expo_push_token?: string
          updated_at?: string
          user_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["uuid"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          product_id: number | null
          rating: number
          updated_at: string
          user_uuid: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: number
          product_id?: number | null
          rating: number
          updated_at?: string
          user_uuid: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: number
          product_id?: number | null
          rating?: number
          updated_at?: string
          user_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["uuid"]
          },
        ]
      }
      staff_users: {
        Row: {
          active: boolean
          created_at: string
          email: string
          full_name: string
          role: Database["public"]["Enums"]["staff_role_enum"]
          uuid: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          full_name: string
          role?: Database["public"]["Enums"]["staff_role_enum"]
          uuid: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          full_name?: string
          role?: Database["public"]["Enums"]["staff_role_enum"]
          uuid?: string
        }
        Relationships: []
      }
      store_details: {
        Row: {
          allow_scheduled_orders: boolean
          announcement: string | null
          close_hour: number
          close_minute: number
          created_at: string
          email_contact: string | null
          facebook_url: string | null
          id: number
          instagram_url: string | null
          is_in_maintenance: boolean
          is_open: boolean
          open_hour: number
          open_minute: number
          phone_contact: string | null
          tiktok_url: string | null
          timezone: string
          updated_at: string
          website_url: string | null
          whatsapp_url: string | null
        }
        Insert: {
          allow_scheduled_orders?: boolean
          announcement?: string | null
          close_hour: number
          close_minute: number
          created_at?: string
          email_contact?: string | null
          facebook_url?: string | null
          id?: number
          instagram_url?: string | null
          is_in_maintenance?: boolean
          is_open?: boolean
          open_hour: number
          open_minute: number
          phone_contact?: string | null
          tiktok_url?: string | null
          timezone?: string
          updated_at?: string
          website_url?: string | null
          whatsapp_url?: string | null
        }
        Update: {
          allow_scheduled_orders?: boolean
          announcement?: string | null
          close_hour?: number
          close_minute?: number
          created_at?: string
          email_contact?: string | null
          facebook_url?: string | null
          id?: number
          instagram_url?: string | null
          is_in_maintenance?: boolean
          is_open?: boolean
          open_hour?: number
          open_minute?: number
          phone_contact?: string | null
          tiktok_url?: string | null
          timezone?: string
          updated_at?: string
          website_url?: string | null
          whatsapp_url?: string | null
        }
        Relationships: []
      }
      store_schedules: {
        Row: {
          close_time: string
          day_of_week: number
          id: string
          is_open: boolean
          open_time: string
          store_id: number
        }
        Insert: {
          close_time: string
          day_of_week: number
          id?: string
          is_open?: boolean
          open_time: string
          store_id: number
        }
        Update: {
          close_time?: string
          day_of_week?: number
          id?: string
          is_open?: boolean
          open_time?: string
          store_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_schedules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_details"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          faculty: Database["public"]["Enums"]["faculties"]
          first_name: string | null
          last_name: string | null
          phone: string
          stripe_customer_id: string | null
          uuid: string
        }
        Insert: {
          created_at?: string
          email?: string
          faculty?: Database["public"]["Enums"]["faculties"]
          first_name?: string | null
          last_name?: string | null
          phone: string
          stripe_customer_id?: string | null
          uuid: string
        }
        Update: {
          created_at?: string
          email?: string
          faculty?: Database["public"]["Enums"]["faculties"]
          first_name?: string | null
          last_name?: string | null
          phone?: string
          stripe_customer_id?: string | null
          uuid?: string
        }
        Relationships: []
      }
    }
    Views: {
      orders_today: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          display_number: number | null
          id: number | null
          is_takeaway: boolean | null
          payment_status:
            | Database["public"]["Enums"]["payment_status_enum"]
            | null
          ready_at: string | null
          scheduled_delivery_time: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["order_status_enum"] | null
          stripe_payment_intent_id: string | null
          total: number | null
          updated_at: string | null
          user_uuid: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          display_number?: number | null
          id?: number | null
          is_takeaway?: boolean | null
          payment_status?:
            | Database["public"]["Enums"]["payment_status_enum"]
            | null
          ready_at?: string | null
          scheduled_delivery_time?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["order_status_enum"] | null
          stripe_payment_intent_id?: string | null
          total?: number | null
          updated_at?: string | null
          user_uuid?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          display_number?: number | null
          id?: number | null
          is_takeaway?: boolean | null
          payment_status?:
            | Database["public"]["Enums"]["payment_status_enum"]
            | null
          ready_at?: string | null
          scheduled_delivery_time?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["order_status_enum"] | null
          stripe_payment_intent_id?: string | null
          total?: number | null
          updated_at?: string | null
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["uuid"]
          },
        ]
      }
      recent_notifications: {
        Row: {
          created_at: string | null
          id: number | null
          message: string | null
          order_id: number | null
          title: string | null
          type: Database["public"]["Enums"]["notification_type_enum"] | null
          user_uuid: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number | null
          message?: string | null
          order_id?: number | null
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type_enum"] | null
          user_uuid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number | null
          message?: string | null
          order_id?: number | null
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type_enum"] | null
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["uuid"]
          },
        ]
      }
    }
    Functions: {
      column_has_default: {
        Args: { p_column: string; p_schema: string; p_table: string }
        Returns: boolean
      }
      get_faculties_enum: { Args: never; Returns: string[] }
      save_option_group_with_options: {
        Args: {
          p_active?: boolean
          p_group_id?: number
          p_max_select?: number
          p_min_select?: number
          p_name?: string
          p_options?: Json
        }
        Returns: number
      }
      save_product_option_groups: {
        Args: { p_groups: Json; p_product_id: number }
        Returns: undefined
      }
    }
    Enums: {
      banner_action: "NONE" | "REDIRECT_PRODUCT" | "REDIRECT_MENU"
      faculties:
        | "Default"
        | "Comunicación"
        | "Diseño"
        | "Derecho"
        | "Ingeniería"
        | "Medicina"
        | "Negocios"
        | "Psicología"
        | "Turismo"
        | "Administrativo"
      notification_type_enum:
        | "PedidoRecibido"
        | "PedidoListo"
        | "PedidoEnPreparacion"
        | "PedidoEntregado"
        | "NotificacionPersonal"
        | "NotificacionGeneral"
      order_status_enum:
        | "Creando"
        | "Recibido"
        | "EnPreparacion"
        | "Listo"
        | "Entregado"
      payment_status_enum:
        | "pending_payment"
        | "paid"
        | "payment_failed"
        | "canceled"
      staff_role_enum: "Administrador" | "Operador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      banner_action: ["NONE", "REDIRECT_PRODUCT", "REDIRECT_MENU"],
      faculties: [
        "Default",
        "Comunicación",
        "Diseño",
        "Derecho",
        "Ingeniería",
        "Medicina",
        "Negocios",
        "Psicología",
        "Turismo",
        "Administrativo",
      ],
      notification_type_enum: [
        "PedidoRecibido",
        "PedidoListo",
        "PedidoEnPreparacion",
        "PedidoEntregado",
        "NotificacionPersonal",
        "NotificacionGeneral",
      ],
      order_status_enum: [
        "Creando",
        "Recibido",
        "EnPreparacion",
        "Listo",
        "Entregado",
      ],
      payment_status_enum: [
        "pending_payment",
        "paid",
        "payment_failed",
        "canceled",
      ],
      staff_role_enum: ["Administrador", "Operador"],
    },
  },
} as const
