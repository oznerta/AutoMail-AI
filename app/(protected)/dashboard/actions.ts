'use server'

import { createClient } from "@/utils/supabase/server";

export type DashboardStats = {
    totalContacts: number;
    activeAutomations: number;
    emailsSent: number;
    recentContacts: any[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Parallel fetch for speed
    const [
        { count: totalContacts },
        { count: activeAutomations },
        { count: emailsSent },
        { data: recentContacts }
    ] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('automations').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('active', true),
        // Approximating "Emails Sent" by looking at completed automation queue items
        // Note: This mixes all automation step types, but for now it's our best proxy without a dedicated logs table.
        supabase.from('automation_queue').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('contacts').select('email, created_at, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    ]);

    return {
        totalContacts: totalContacts || 0,
        activeAutomations: activeAutomations || 0,
        emailsSent: emailsSent || 0,
        recentContacts: recentContacts || []
    };
}
