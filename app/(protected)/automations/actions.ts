'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// --- Types & Schemas ---

export type Automation = {
    id: string;
    name: string;
    description: string | null;
    status: 'active' | 'paused' | 'draft';
    trigger_type: string | null;
    workflow_config: any; // JSONB
    updated_at: string;
}

const CreateAutomationSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
});

const UpdateAutomationSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'paused', 'draft']).optional(),
    trigger_type: z.string().optional(),
    workflow_config: z.any().optional(),
});

// --- Actions ---

export async function getAutomations(): Promise<Automation[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching automations:', error);
        return [];
    }

    return data as Automation[];
}

export async function getAutomation(id: string): Promise<Automation | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) return null;
    return data as Automation;
}

export async function createAutomation(name: string) {
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validated = CreateAutomationSchema.safeParse({ name });
    if (!validated.success) {
        return { error: "Invalid name" };
    }

    // Generate a secure random token for the webhook
    const webhookToken = `wh_${crypto.randomUUID().replace(/-/g, '')}`;

    const { data, error } = await supabase
        .from('automations')
        .insert({
            user_id: user.id,
            name: validated.data.name,
            status: 'draft',
            trigger_type: 'manual', // Default, user can change later
            workflow_config: { trigger: {}, steps: [] },
            email_template: {},
            webhook_token: webhookToken // Store the token
        })
        .select()
        .single();

    if (error) {
        console.error("Create Automation Error:", error);
        return { error: "Failed to create automation" };
    }

    revalidatePath('/automations');
    return { success: true, id: data.id };
}

export async function updateAutomation(id: string, updates: any) {
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validated = UpdateAutomationSchema.safeParse(updates);
    if (!validated.success) {
        return { error: "Validation failed" };
    }

    const { error } = await supabase
        .from('automations')
        .update({
            ...validated.data,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error("Update Automation Error:", error);
        return { error: "Failed to update automation" };
    }

    revalidatePath(`/automations/${id}`);
    revalidatePath('/automations');
    return { success: true };
}

export async function deleteAutomation(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error("Delete Automation Error:", error);
        return { error: "Failed to delete automation" };
    }

    revalidatePath('/automations');
    return { success: true };
}

export async function getAvailableTags(): Promise<string[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('tags')
        .select('name')
        .order('name');

    if (error) {
        console.error("Fetch Tags Error:", error);
        return [];
    }

    // Since RLS enforces user_id, we just get the tags for this user
    return (data as any[]).map(t => t.name);
}

export async function generateWebhookToken(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const webhookToken = `wh_${crypto.randomUUID().replace(/-/g, '')}`;

    // Suppress TS error if table types aren't generated yet or are out of sync
    // @ts-ignore 
    const { error } = await supabase
        .from('automations')
        .update({ webhook_token: webhookToken })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error("Generate Token Error:", error);
        return { error: "Failed to generate token" };
    }

    revalidatePath(`/automations/${id}`);
    return { success: true, token: webhookToken };
}
