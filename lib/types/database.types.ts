export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          telegram_id: number
          name: string | null
          balance: number
          subscription_expires: string | null
          plan_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          telegram_id: number
          name?: string | null
          balance?: number
          subscription_expires?: string | null
          plan_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          telegram_id?: number
          name?: string | null
          balance?: number
          subscription_expires?: string | null
          plan_id?: string | null
          created_at?: string
        }
      }
      codes: {
        Row: {
          id: string
          code: string
          plan: string
          days_valid: number
          used_by: string | null
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          plan: string
          days_valid: number
          used_by?: string | null
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          plan?: string
          days_valid?: number
          used_by?: string | null
          used_at?: string | null
          created_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          price: number
          duration_days: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          duration_days: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          duration_days?: number
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          reward_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          reward_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          reward_amount?: number
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'payment' | 'referral' | 'code' | 'subscription'
          amount: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'payment' | 'referral' | 'code' | 'subscription'
          amount: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'payment' | 'referral' | 'code' | 'subscription'
          amount?: number
          description?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          amount: number
          method: 'card' | 'sbp' | 'promo'
          status: 'pending' | 'completed' | 'failed'
          external_id: string | null
          gateway_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          method: 'card' | 'sbp' | 'promo'
          status?: 'pending' | 'completed' | 'failed'
          external_id?: string | null
          gateway_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          method?: 'card' | 'sbp' | 'promo'
          status?: 'pending' | 'completed' | 'failed'
          external_id?: string | null
          gateway_data?: Json | null
          created_at?: string
        }
      }
      auth_tokens: {
        Row: {
          id: string
          telegram_id: number
          token: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          telegram_id: number
          token: string
          expires_at: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          telegram_id?: number
          token?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
      }
    }
  }
}

