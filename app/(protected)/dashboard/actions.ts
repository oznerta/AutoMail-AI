'use server'

import { createClient } from "@/utils/supabase/server";

export type DashboardStats = {
    totalContacts: number;
    activeAutomations: number;
    emailsSent: number;
    recentContacts: any[];
    subscriberGrowth: { name: string; total: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Parallel fetch for speed
    const [
        { count: totalContacts },
        { count: activeAutomations },
        { count: emailsSent },
        { data: recentContacts },
        { data: growthData }
    ] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('automations').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
        // Approximating "Emails Sent" by looking at completed automation queue items
        // Note: This mixes all automation step types, but for now it's our best proxy without a dedicated logs table.
        supabase.from('automation_queue').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('contacts').select('email, created_at, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('contacts').select('created_at').eq('user_id', user.id).gte('created_at', sixMonthsAgo.toISOString())
    ]);

    // Process growth data (group by month)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyStats = new Map<string, number>();

    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = months[d.getMonth()];
        monthlyStats.set(key, 0);
    }

    (growthData as { created_at: string }[] | null)?.forEach(contact => {
        const date = new Date(contact.created_at);
        const month = months[date.getMonth()];
        if (monthlyStats.has(month)) {
            monthlyStats.set(month, (monthlyStats.get(month) || 0) + 1);
        }
    });

    const subscriberGrowth = Array.from(monthlyStats.entries()).map(([name, total]) => ({ name, total }));

    return {
        totalContacts: totalContacts || 0,
        activeAutomations: activeAutomations || 0,
        emailsSent: emailsSent || 0,
        recentContacts: recentContacts || [],
        subscriberGrowth
    };
}
