'use server'

import { createClient } from "@/utils/supabase/server";

export type DashboardStats = {
    totalContacts: number;
    activeAutomations: number;
    emailsSent: number;
    totalCampaigns: number;
    recentContacts: any[];
    subscriberGrowth: { name: string; total: number; new: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Parallel fetch for speed
    const [
        { count: totalContacts },
        { data: automationsData },
        { count: queueCompleted },
        { data: recentContacts },
        { data: allContacts }
    ] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('automations').select('id, total_sent, status, type').eq('user_id', user.id),
        supabase.from('automation_queue').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('contacts').select('email, created_at, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('contacts').select('created_at').eq('user_id', user.id).order('created_at', { ascending: true })
    ]);

    const activeAutomations = automationsData?.filter((a: any) => a.status === 'active' && a.type !== 'campaign').length || 0;
    const totalCampaigns = automationsData?.filter((a: any) => a.type === 'campaign').length || 0;
    const sumSent = automationsData?.reduce((acc: number, a: any) => acc + (a.total_sent || 0), 0) || 0;
    const emailsSent = Math.max(sumSent, queueCompleted || 0);

    // Calculate realistic subscriber growth (cumulative total and monthly new signups) over trailing 12 months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const growthArray: { name: string; total: number; new: number }[] = [];

    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const monthStartDate = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0);
        const monthName = months[monthDate.getMonth()];

        const totalAtMonth = (allContacts as { created_at: string }[] | null)?.filter(
            c => new Date(c.created_at) <= monthDate
        ).length || 0;

        const newAtMonth = (allContacts as { created_at: string }[] | null)?.filter(c => {
            const d = new Date(c.created_at);
            return d >= monthStartDate && d <= monthDate;
        }).length || 0;

        growthArray.push({ name: monthName, total: totalAtMonth, new: newAtMonth });
    }

    return {
        totalContacts: totalContacts || 0,
        activeAutomations: activeAutomations || 0,
        emailsSent: emailsSent || 0,
        totalCampaigns: totalCampaigns || 0,
        recentContacts: recentContacts || [],
        subscriberGrowth: growthArray
    };
}
