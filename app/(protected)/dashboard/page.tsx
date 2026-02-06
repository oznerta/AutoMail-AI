import { StatsCard } from "@/components/dashboard/stats-card";
import { Users, Zap, Mail, TrendingUp, ArrowUpRight } from "lucide-react";
import { getDashboardStats } from "./actions";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your system performance.</p>
                </div>
                <div className="hidden md:block">
                    <Button asChild size="sm" className="gap-1 shadow-lg shadow-primary/20">
                        <Link href="/contacts">
                            View Contacts <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid - Premium Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Subscribers"
                    value={stats.totalContacts}
                    description="All time contacts database"
                    icon={Users}
                />
                <StatsCard
                    title="Active Automations"
                    value={stats.activeAutomations}
                    description="Workflows currently running"
                    icon={Zap}
                />
                <StatsCard
                    title="Emails Sent"
                    value={stats.emailsSent}
                    description="Successful deliveries"
                    icon={Mail}
                />
                <Card className="opacity-70 border-dashed bg-muted/20 hover:opacity-100 transition-opacity flex flex-col justify-center items-center group">
                    <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-2">
                        {/* <CardTitle className="text-sm font-medium text-muted-foreground w-full flex justify-between">
                            Open Rate <TrendingUp className="h-4 w-4" />
                        </CardTitle> */}
                        <TrendingUp className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                    </CardHeader>
                    <CardContent className="text-center pb-6">
                        <div className="text-2xl font-bold text-muted-foreground group-hover:text-foreground transition-colors">Analytics</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Detailed reporting module coming soon
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section - NEW */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <OverviewChart data={stats.subscriberGrowth} />

                {/* Onboarding / Tips Card - Moved here for better layout balance */}
                <Card className="col-span-3 border-none bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Zap className="w-48 h-48 -mr-12 -mt-12 rotate-12" />
                    </div>
                    <CardHeader className="relative z-10">
                        <CardTitle className="text-slate-100">Quick Start</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 relative z-10">
                        <div className="flex items-start gap-3 group">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100/10 text-[10px] font-bold group-hover:bg-teal-500 group-hover:text-white transition-colors">1</span>
                            <p className="text-sm text-slate-300">Import your contacts via CSV to populate your database instantly.</p>
                        </div>
                        <div className="flex items-start gap-3 group">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100/10 text-[10px] font-bold group-hover:bg-teal-500 group-hover:text-white transition-colors">2</span>
                            <p className="text-sm text-slate-300">Create a "Welcome Series" automation to engage new leads.</p>
                        </div>
                        <div className="flex items-start gap-3 group">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100/10 text-[10px] font-bold group-hover:bg-teal-500 group-hover:text-white transition-colors">3</span>
                            <p className="text-sm text-slate-300">Verify your sender domain in Settings to ensure delivery.</p>
                        </div>
                        <Button variant="secondary" className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white border-0">
                            View Documentation
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-7 border-muted/60 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden">
                    <CardHeader>
                        <CardTitle>Recent Subscribers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {stats.recentContacts.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                    No subscribers found.
                                </div>
                            ) : (
                                stats.recentContacts.map((contact, i) => (
                                    <div key={i} className="flex items-center group cursor-default">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500/20 to-teal-600/10 flex items-center justify-center ring-2 ring-background group-hover:scale-110 transition-transform">
                                            <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{contact.email}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Added {new Date(contact.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="ml-auto">
                                            <Badge variant={contact.status === 'active' ? 'secondary' : 'outline'} className="text-[10px] uppercase font-bold tracking-wider">
                                                {contact.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
