'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function checkOnboardingStatus() {
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated', isComplete: false };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

    // Check if preferences explicitly say onboarding_completed: true
    const isComplete = (profile?.preferences as any)?.onboarding_completed === true;

    return { isComplete };
}

export async function completeOnboarding() {
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    // Get existing preferences to merge
    const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

    const currentPrefs = (profile as any)?.preferences || {};

    const { error } = await supabase
        .from('profiles')
        .update({
            preferences: {
                ...currentPrefs,
                onboarding_completed: true
            }
        })
        .eq('id', user.id);

    if (error) {
        console.error("Failed to update onboarding status:", error);
        throw error;
    }

    revalidatePath('/', 'layout');
    return { success: true };
}
