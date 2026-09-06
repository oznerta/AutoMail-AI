'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnalyticsData, getCampaignAnalytics } from '@/app/(protected)/campaigns/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Send,
    Eye,
    MousePointerClick,
    AlertTriangle,
    CheckCircle2,
    Clock,
    XCircle,
    RefreshCw,
    Search,
    Filter,
    BarChart3
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell
} from 'recharts';
import { format } from 'date-fns';

interface CampaignAnalyticsProps {
    automationId: string;
    title?: string;
    description?: string;
}

export function CampaignAnalytics({ automationId, title, description }: CampaignAnalyticsProps) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

    const loadAnalytics = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        try {
            const result = await getCampaignAnalytics(automationId);
            setData(result);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setLoading(false);
            if (isManualRefresh) setRefreshing(false);
        }
    }, [automationId]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const filteredJobs = useMemo(() => {
        if (!data?.recent_jobs) return [];
        return data.recent_jobs.filter((job) => {
            const matchesQuery =
                job.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.contact_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [data?.recent_jobs, searchQuery, statusFilter]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading performance analytics...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center border rounded-xl bg-card">
                <p className="text-sm text-muted-foreground">No analytics data available yet.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => loadAnalytics(true)}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Refresh Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-foreground">{title || 'Performance & Engagement'}</h3>
                    <p className="text-xs text-muted-foreground">
                        {description || 'Real-time delivery rates, engagement metrics, and recipient activity logs.'}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadAnalytics(true)}
                    disabled={refreshing}
                    className="self-start sm:self-auto gap-2"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Stats
                </Button>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Sent & Delivered */}
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm relative overflow-hidden">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Delivered
                        </CardTitle>
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <Send className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-black text-foreground">
                            {data.total_delivered.toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground ml-1.5">/ {data.total_sent} sent</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold">
                                {data.delivery_rate}% Delivery Rate
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Opens */}
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm relative overflow-hidden">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Unique Opens
                        </CardTitle>
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Eye className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-black text-foreground">
                            {data.total_opened.toLocaleString()}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs font-semibold">
                                {data.open_rate}% Open Rate
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Clicks */}
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm relative overflow-hidden">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Link Clicks
                        </CardTitle>
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                            <MousePointerClick className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-black text-foreground">
                            {data.total_clicked.toLocaleString()}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-semibold">
                                {data.click_rate}% Click-to-Open
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Bounces */}
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm relative overflow-hidden">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Bounced
                        </CardTitle>
                        <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-black text-foreground">
                            {data.total_bounced.toLocaleString()}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs font-semibold">
                                {data.bounce_rate}% Bounce Rate
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Funnel Chart */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                <CardHeader className="p-6 pb-2">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base font-bold">Engagement Funnel</CardTitle>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground">
                        Volume progression from send to recipient interactions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-4">
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.chart_data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                                <XAxis
                                    dataKey="stage"
                                    tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.7 }}
                                    axisLine={{ opacity: 0.2 }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.7 }}
                                    axisLine={{ opacity: 0.2 }}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '0.75rem',
                                        fontSize: '0.85rem',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {data.chart_data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Recipient Activity Feed Table */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                <CardHeader className="p-6 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base font-bold">Recipient Activity & Execution Log</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Detailed status of each subscriber processed in this workflow queue.
                            </CardDescription>
                        </div>
                        {/* Search & Filter Controls */}
                        <div className="flex items-center gap-2">
                            <div className="relative w-48 sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Filter recipient..."
                                    className="pl-8 h-8 text-xs bg-background/80"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center rounded-lg border bg-background/80 p-0.5">
                                {(['all', 'completed', 'pending', 'failed'] as const).map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                                            statusFilter === status
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/40 text-muted-foreground uppercase border-y border-border/50 font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Recipient</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Processed At</th>
                                    <th className="px-6 py-3">Details / Errors</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {filteredJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                                            No matching recipient activity recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredJobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <div className="font-semibold text-foreground">{job.contact_email}</div>
                                                <div className="text-[11px] text-muted-foreground">{job.contact_name}</div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                {job.status === 'completed' && (
                                                    <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Delivered
                                                    </span>
                                                )}
                                                {job.status === 'pending' && (
                                                    <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                                                        <Clock className="h-3.5 w-3.5" /> Enqueued
                                                    </span>
                                                )}
                                                {job.status === 'failed' && (
                                                    <span className="inline-flex items-center gap-1 text-destructive font-medium">
                                                        <XCircle className="h-3.5 w-3.5" /> Failed
                                                    </span>
                                                )}
                                                {job.status === 'processing' && (
                                                    <span className="inline-flex items-center gap-1 text-primary font-medium animate-pulse">
                                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> In Flight
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5 text-muted-foreground font-mono">
                                                {job.updated_at
                                                    ? format(new Date(job.updated_at), 'MMM d, yyyy h:mm a')
                                                    : 'Pending'}
                                            </td>
                                            <td className="px-6 py-3.5 text-muted-foreground">
                                                {job.error_message ? (
                                                    <span className="text-destructive bg-destructive/10 px-2 py-0.5 rounded text-[11px] font-mono break-all">
                                                        {job.error_message}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground/60 text-[11px]">Normal execution</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
