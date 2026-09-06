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
 * Helper to get the absolute URL for redirects, OAuth callbacks, and API calls.
 * Automatically detects the current origin in browser environments,
 * and dynamically infers Vercel / environment settings on the server.
 */
export const getServerURL = () => {
    let url =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.NEXT_PUBLIC_VERCEL_URL
            ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
            : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000');

    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`;

    // Make sure to not include a trailing `/`.
    url = url.endsWith('/') ? url.slice(0, -1) : url;

    return url;
};

export const getURL = () => {
    // 1. Client-side browser: Always automatically use the active origin
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }

    // 2. Server-side: Determine URL from environment variables
    return getServerURL();
};

/**
 * Initiates Google OAuth sign-in flow
 * 
 * @param redirectTo - Optional custom redirect path after login
 */
export async function signInWithGoogle(redirectTo?: string) {
    const supabase = createClient();
    const baseUrl = getURL();

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
