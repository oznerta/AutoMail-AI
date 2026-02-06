'use server'

import { createClient } from "@/utils/supabase/server";
import { generateApiKey, hashApiKey } from "@/lib/api-keys";
import { revalidatePath } from "next/cache";
import { decrypt } from "@/lib/crypto";

export async function createWebhookKey(name: string) {
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const key = generateApiKey();
    const keyHash = hashApiKey(key);
    const prefix = key.substring(0, 18) + "...";

    const { data, error } = await supabase
        .from('webhook_keys')
        .insert({
            user_id: user.id,
            name,
            key_hash: keyHash,
            key_prefix: prefix,
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath('/settings');
    return { success: true, key, data };
}

export async function revokeWebhookKey(id: string) {
    const supabase = await createClient() as any;
    const { error } = await supabase.from('webhook_keys').delete().eq('id', id);

    if (error) return { error: error.message };
    revalidatePath('/settings');
    return { success: true };
}

// --- Sender Identity Actions ---

export async function getSenderIdentities() {
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase.from('sender_identities').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    return data || [];
}

export async function addSenderIdentity(name: string, email: string) {
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // 1. Get Resend Key
    const { data: keyData, error: keyError } = await supabase
        .from('vault_keys')
        .select('encrypted_value')
        .eq('user_id', user.id)
        .eq('provider', 'resend')
        .single();

    if (keyError || !keyData) {
        return { error: "No Resend API Key found. Configure it in BYOK settings first." };
    }

    // 2. Verify Domain via Resend
    try {
        const apiKey = await decrypt(keyData.encrypted_value);
        const domain = email.split('@')[1];

        const res = await fetch('https://api.resend.com/domains', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!res.ok) throw new Error("Failed to fetch domains from Resend");

        const domainsData = await res.json();
        // Resend returns object { data: [...] }
        const domains = domainsData.data || [];
        const verifiedDomain = domains.find((d: any) => d.name === domain && d.status === 'verified');

        if (!verifiedDomain && domain !== 'resend.dev') { // Allow resend.dev for testing if they use onboarding
            // If not sending via onboarding and domain not verified
            return { error: `Domain '${domain}' is not verified in your Resend account.` };
        }

    } catch (error: any) {
        console.error("Resend Verification Error:", error);
        return { error: error.message || "Failed to verify domain with Resend." };
    }

    // 3. Save to DB
    const { error } = await supabase.from('sender_identities').insert({
        user_id: user.id,
        name,
        email,
        verified: true // We pre-verified it above
    });

    if (error) return { error: error.message };

    revalidatePath('/settings');
    return { success: true };
}

export async function deleteSenderIdentity(id: string) {
    const supabase = await createClient() as any;
    const { error } = await supabase.from('sender_identities').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/settings');
    return { success: true };
}

export async function deleteAccount() {
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    try {
        // Use Admin Client to delete user from Auth
        const { createAdminClient } = await import("@/utils/supabase/server");
        const adminAuth = createAdminClient().auth.admin;

        const { error } = await adminAuth.deleteUser(user.id);
        if (error) throw error;

        // Sign out to clear cookies
        await supabase.auth.signOut();
        return { success: true };
    } catch (error: any) {
        console.error("Delete Account Error:", error);
        return { error: error.message || "Failed to delete account" };
    }
}
