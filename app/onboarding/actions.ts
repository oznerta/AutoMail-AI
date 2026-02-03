'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function checkOnboardingStatus() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Check Vault Keys
    const { data: keys } = await supabase
        .from('vault_keys')
        .select('provider')
        .eq('user_id', user.id)
        .returns<{ provider: string }[]>();

    const hasOpenAI = keys?.some(k => k.provider === 'openai') || false;
    const hasResend = keys?.some(k => k.provider === 'resend') || false;

    // Check Sender Identities
    const { count: senderCount } = await supabase
        .from('sender_identities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const hasSender = (senderCount || 0) > 0;

    return {
        hasOpenAI,
        hasResend,
        hasSender,
        isComplete: hasOpenAI && hasResend && hasSender
    };
}
