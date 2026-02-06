/**
 * Authentication Utilities
 * Centralized auth functions for email/password authentication
 */

import { createClient } from './client';

export interface AuthError {
    message: string;
    code?: string;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
    email: string,
    password: string
): Promise<{ error: AuthError | null }> {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return {
            error: {
                message: getErrorMessage(error.message),
                code: error.status?.toString(),
            },
        };
    }

    return { error: null };
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
    email: string,
    password: string,
    metadata?: {
        firstName?: string;
        lastName?: string;
    }
): Promise<{ error: AuthError | null }> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${baseUrl}/auth/callback`,
            data: {
                first_name: metadata?.firstName,
                last_name: metadata?.lastName,
            },
        },
    });

    if (error) {
        return {
            error: {
                message: getErrorMessage(error.message),
                code: error.status?.toString(),
            },
        };
    }

    return { error: null };
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        return {
            error: {
                message: 'Failed to sign out. Please try again.',
                code: error.status?.toString(),
            },
        };
    }

    return { error: null };
}

/**
 * Request password reset email
 */
export async function resetPassword(
    email: string
): Promise<{ error: AuthError | null }> {
    const supabase = createClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/reset-password`,
    });

    if (error) {
        return {
            error: {
                message: 'Failed to send reset email. Please try again.',
                code: error.status?.toString(),
            },
        };
    }

    return { error: null };
}

/**
 * Update user password
 */
export async function updatePassword(
    newPassword: string
): Promise<{ error: AuthError | null }> {
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) {
        return {
            error: {
                message: 'Failed to update password. Please try again.',
                code: error.status?.toString(),
            },
        };
    }

    return { error: null };
}

/**
 * Convert Supabase error messages to user-friendly messages
 */
function getErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
        'Invalid login credentials': 'Invalid email or password',
        'Email not confirmed': 'Please verify your email address',
        'User already registered': 'An account with this email already exists',
        'Password should be at least 6 characters': 'Password must be at least 8 characters',
        'email_address_invalid': 'This email address is not allowed. Please use a different email provider (e.g., Gmail, Outlook).',
        'Email address is invalid': 'This email address is not allowed. Please use a different email provider (e.g., Gmail, Outlook).',
    };

    // Check if we have a custom message for this error
    if (errorMap[error]) {
        return errorMap[error];
    }

    // If the error contains "invalid", return it as-is for better debugging
    if (error.toLowerCase().includes('invalid') || error.toLowerCase().includes('email')) {
        return error;
    }

    return 'An error occurred. Please try again.';
}
