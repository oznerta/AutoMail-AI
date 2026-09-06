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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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

export type AnalyticsData = {
    total_sent: number;
    total_opened: number;
    total_clicked: number;
    total_bounced: number;
    total_delivered: number;
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    bounce_rate: number;
    chart_data: Array<{ stage: string; count: number; fill: string }>;
    recent_jobs: Array<{
        id: string;
        contact_id: string;
        status: 'pending' | 'processing' | 'completed' | 'failed';
        execute_at: string;
        error_message: string | null;
        updated_at: string;
        contact_email: string;
        contact_name: string;
    }>;
};

export async function getCampaignAnalytics(id: string): Promise<AnalyticsData> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 1. Fetch automation metrics
    const { data: auto, error: autoError } = await supabase
        .from('automations')
        .select('total_sent, total_opened, total_clicked, total_bounced')
        .eq('user_id', user.id)
        .eq('id', id)
        .single();

    if (autoError) throw autoError;

    const total_sent = (auto as any)?.total_sent || 0;
    const total_opened = (auto as any)?.total_opened || 0;
    const total_clicked = (auto as any)?.total_clicked || 0;
    const total_bounced = (auto as any)?.total_bounced || 0;
    const total_delivered = Math.max(0, total_sent - total_bounced);

    const delivery_rate = total_sent > 0 ? Math.round((total_delivered / total_sent) * 100) : 0;
    const open_rate = total_delivered > 0 ? Math.round((total_opened / total_delivered) * 100) : 0;
    const click_rate = total_opened > 0 ? Math.round((total_clicked / total_opened) * 100) : 0;
    const bounce_rate = total_sent > 0 ? Math.round((total_bounced / total_sent) * 100) : 0;

    // 2. Fetch recent queue jobs with contact details
    const { data: jobs } = await supabase
        .from('automation_queue')
        .select(`
            id,
            contact_id,
            status,
            execute_at,
            error_message,
            updated_at,
            contacts (
                email,
                first_name,
                last_name
            )
        `)
        .eq('automation_id', id)
        .order('updated_at', { ascending: false })
        .limit(50);

    const recent_jobs = (jobs || []).map((j: any) => {
        const contact = Array.isArray(j.contacts) ? j.contacts[0] : j.contacts;
        const name = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || 'Subscriber';
        return {
            id: j.id,
            contact_id: j.contact_id,
            status: j.status,
            execute_at: j.execute_at,
            error_message: j.error_message,
            updated_at: j.updated_at,
            contact_email: contact?.email || 'Unknown',
            contact_name: name
        };
    });

    const chart_data = [
        { stage: 'Sent', count: total_sent, fill: '#3b82f6' },
        { stage: 'Delivered', count: total_delivered, fill: '#10b981' },
        { stage: 'Opened', count: total_opened, fill: '#8b5cf6' },
        { stage: 'Clicked', count: total_clicked, fill: '#f59e0b' },
        { stage: 'Bounced', count: total_bounced, fill: '#ef4444' },
    ];

    return {
        total_sent,
        total_opened,
        total_clicked,
        total_bounced,
        total_delivered,
        delivery_rate,
        open_rate,
        click_rate,
        bounce_rate,
        chart_data,
        recent_jobs
    };
}
