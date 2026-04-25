// Tipos generados manualmente del schema de Supabase.
// Regenerar con: supabase gen types typescript --project-id TU_ID > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppointmentStatus = 'pending' | 'completed' | 'cancelled' | 'no_show'
export type UserRole = 'super_admin' | 'barber'
export type NotificationType = 'new_appointment' | 'cancellation'

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          active?: boolean
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string | null
          role: UserRole
          name: string
          email: string
          phone: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id: string
          tenant_id?: string | null
          role: UserRole
          name: string
          email: string
          phone?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          role?: UserRole
          name?: string
          email?: string
          phone?: string | null
          active?: boolean
          created_at?: string
        }
      }
      barbers: {
        Row: {
          id: string
          user_id: string | null
          tenant_id: string
          name: string
          bio: string | null
          avatar_url: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          tenant_id: string
          name: string
          bio?: string | null
          avatar_url?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          tenant_id?: string
          name?: string
          bio?: string | null
          avatar_url?: string | null
          active?: boolean
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          duration_minutes: number
          price: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          duration_minutes: number
          price: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          price?: number
          active?: boolean
          created_at?: string
        }
      }
      barber_services: {
        Row: {
          barber_id: string
          service_id: string
        }
        Insert: {
          barber_id: string
          service_id: string
        }
        Update: {
          barber_id?: string
          service_id?: string
        }
      }
      working_schedules: {
        Row: {
          id: string
          barber_id: string
          day_of_week: number
          start_time: string
          end_time: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          barber_id: string
          day_of_week: number
          start_time: string
          end_time: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          barber_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          active?: boolean
          created_at?: string
        }
      }
      schedule_blocks: {
        Row: {
          id: string
          barber_id: string | null
          tenant_id: string
          date: string
          start_time: string | null
          end_time: string | null
          reason: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          barber_id?: string | null
          tenant_id: string
          date: string
          start_time?: string | null
          end_time?: string | null
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          barber_id?: string | null
          tenant_id?: string
          date?: string
          start_time?: string | null
          end_time?: string | null
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          first_name: string
          last_name: string
          phone: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          first_name: string
          last_name: string
          phone: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          first_name?: string
          last_name?: string
          phone?: string
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          barber_id: string
          service_id: string
          date: string
          start_time: string
          end_time: string
          status: AppointmentStatus
          booked_at: string
          cancelled_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          barber_id: string
          service_id: string
          date: string
          start_time: string
          end_time: string
          status?: AppointmentStatus
          booked_at?: string
          cancelled_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          barber_id?: string
          service_id?: string
          date?: string
          start_time?: string
          end_time?: string
          status?: AppointmentStatus
          booked_at?: string
          cancelled_at?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          appointment_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          appointment_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          appointment_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_barber_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_available_slots: {
        Args: {
          p_barber_id: string
          p_service_id: string
          p_date: string
        }
        Returns: { slot_time: string }[]
      }
      upsert_client: {
        Args: {
          p_tenant_id: string
          p_first_name: string
          p_last_name: string
          p_phone: string
        }
        Returns: string
      }
      create_appointment_atomic: {
        Args: {
          p_tenant_id: string
          p_client_id: string
          p_barber_id: string
          p_service_id: string
          p_date: string
          p_start_time: string
          p_end_time: string
          p_notes: string | null
        }
        Returns: string | null
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Tipos derivados para uso conveniente en la app
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Barber = Database['public']['Tables']['barbers']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type BarberService = Database['public']['Tables']['barber_services']['Row']
export type WorkingSchedule = Database['public']['Tables']['working_schedules']['Row']
export type ScheduleBlock = Database['public']['Tables']['schedule_blocks']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Tipos enriquecidos para la UI
export type BarberWithServices = Barber & {
  services: Service[]
}

export type AppointmentWithDetails = Appointment & {
  client: Client
  barber: Barber
  service: Service
}
