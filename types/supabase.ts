/**
 * Supabase Database Types
 * 
 * This file will be auto-generated using:
 * npx supabase gen types typescript --project-id vrmvmguscjqtiiqsmroj > types/supabase.ts
 * 
 * For now, we define the basic structure manually
 */

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
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    preferences: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    preferences?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    preferences?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            vault_keys: {
                Row: {
                    id: string
                    user_id: string
                    provider: string
                    key_name: string
                    encrypted_value: Json
                    metadata: Json
                    is_active: boolean
                    created_at: string
                    updated_at: string
                    last_used_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    provider: string
                    key_name: string
                    encrypted_value: Json
                    metadata?: Json
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                    last_used_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    provider?: string
                    key_name?: string
                    encrypted_value?: Json
                    metadata?: Json
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                    last_used_at?: string | null
                }
            }
            contacts: {
                Row: {
                    id: string
                    user_id: string
                    email: string
                    first_name: string | null
                    last_name: string | null
                    company: string | null
                    tags: string[]
                    custom_fields: Json
                    status: 'active' | 'unsubscribed' | 'bounced'
                    source: string | null
                    created_at: string
                    updated_at: string
                    last_contacted_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    email: string
                    first_name?: string | null
                    last_name?: string | null
                    company?: string | null
                    tags?: string[]
                    custom_fields?: Json
                    status?: 'active' | 'unsubscribed' | 'bounced'
                    source?: string | null
                    created_at?: string
                    updated_at?: string
                    last_contacted_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    email?: string
                    first_name?: string | null
                    last_name?: string | null
                    company?: string | null
                    tags?: string[]
                    custom_fields?: Json
                    status?: 'active' | 'unsubscribed' | 'bounced'
                    source?: string | null
                    created_at?: string
                    updated_at?: string
                    last_contacted_at?: string | null
                }
            }
            automations: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    status: 'draft' | 'active' | 'paused' | 'completed'
                    trigger_type: string
                    workflow_config: Json
                    email_template: Json
                    email_provider_key_id: string | null
                    ai_provider_key_id: string | null
                    total_sent: number
                    total_opened: number
                    total_clicked: number
                    total_bounced: number
                    scheduled_at: string | null
                    started_at: string | null
                    completed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    status?: 'draft' | 'active' | 'paused' | 'completed'
                    trigger_type: string
                    workflow_config?: Json
                    email_template?: Json
                    email_provider_key_id?: string | null
                    ai_provider_key_id?: string | null
                    total_sent?: number
                    total_opened?: number
                    total_clicked?: number
                    total_bounced?: number
                    scheduled_at?: string | null
                    started_at?: string | null
                    completed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    status?: 'draft' | 'active' | 'paused' | 'completed'
                    trigger_type?: string
                    workflow_config?: Json
                    email_template?: Json
                    email_provider_key_id?: string | null
                    ai_provider_key_id?: string | null
                    total_sent?: number
                    total_opened?: number
                    total_clicked?: number
                    total_bounced?: number
                    scheduled_at?: string | null
                    started_at?: string | null
                    completed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            webhook_keys: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    key_hash: string
                    key_prefix: string
                    is_active: boolean
                    last_used_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    key_hash: string
                    key_prefix: string
                    is_active?: boolean
                    last_used_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    key_hash?: string
                    key_prefix?: string
                    is_active?: boolean
                    last_used_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            },
            email_templates: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    subject: string | null
                    content: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    subject?: string | null
                    content?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    subject?: string | null
                    content?: string | null
                    created_at?: string
                    updated_at?: string
                }
            },
            sender_identities: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    email: string
                    is_verified: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    email: string
                    is_verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    email?: string
                    is_verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
