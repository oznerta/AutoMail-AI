'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type Campaign = {
    id: string;
    name: string;
    type: 'campaign';
    status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
    workflow_config: {
        subject?: string;
        preview_text?: string;
        from_name?: string;
        reply_to?: string;
    };
    segment_config: {
        type: 'all' | 'tag';
        value?: string[]; // Tags
    };
    email_template?: string; // HTML Content
    scheduled_at?: string;
    created_at: string;
    active: boolean;
};

export async function getCampaigns() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'campaign')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Campaign[];
}

export async function getCampaign(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', id)
        .single();

    if (error) return null;
    return data as Campaign;
}

export async function createCampaign(name: string): Promise<Campaign> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await (supabase
        .from('automations') as any)
        .insert({
            user_id: user.id,
            name,
            type: 'campaign',
            status: 'draft',
            active: false,
            workflow_config: {
                subject: name,
                steps: [
                    {
                        id: 'step_1',
                        type: 'send_email',
                        config: {}
                    }
                ]
            }, // Default subject = name
            segment_config: { type: 'all' },
            email_template: ''
        })
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/campaigns');
    return data;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await (supabase
        .from('automations') as any)
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('id', id);

    if (error) throw error;
    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${id}`);
}

export async function deleteCampaign(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('automations')
        .delete()
        .eq('user_id', user.id)
        .eq('id', id);

    if (error) throw error;
    revalidatePath('/campaigns');
}
