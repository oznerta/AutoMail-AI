/**
 * Client-side Supabase Client
 * 
 * For use in Client Components and browser-side operations
 */

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

/**
 * Creates a Supabase client for client-side operations
 * 
 * This client:
 * - Works in Client Components (use client directive)
 * - Automatically manages authentication state in the browser
 * - Shares session across tabs
 * 
 * @returns Type-safe Supabase client
 */
export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/**
 * Initiates Google OAuth sign-in flow
 * 
 * @param redirectTo - Optional custom redirect path after login
 */
export async function signInWithGoogle(redirectTo?: string) {
    const supabase = createClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectTo || `${baseUrl}/auth/callback`,
            queryParams: {
                access_type: 'offline', // Requests a refresh token
                prompt: 'consent',
            },
        },
    });
}
