import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Zap, Mail, TrendingUp } from "lucide-react";
import { getDashboardStats } from "./actions";


export default async function DashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your email marketing performance.</p>
            </div>

            {/* Stats Grid - Mobile Friendly */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Subscribers
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalContacts}</div>
                        <p className="text-xs text-muted-foreground">
                            All time contacts
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Automations
                        </CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeAutomations}</div>
                        <p className="text-xs text-muted-foreground">
                            Workflows running
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Emails Sent
                        </CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.emailsSent}</div>
                        <p className="text-xs text-muted-foreground">
                            Delivered via automation
                        </p>
                    </CardContent>
                </Card>
                <Card className="opacity-60 border-dashed">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Avg. Open Rate
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">--%</div>
                        <p className="text-xs text-muted-foreground">
                            Analytics coming soon
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Subscribers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {stats.recentContacts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No subscribers yet.</p>
                            ) : (
                                stats.recentContacts.map((contact, i) => (
                                    <div key={i} className="flex items-center">
                                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{contact.email}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(contact.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium">
                                            <span className={`text-xs px-2 py-1 rounded-full ${contact.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {contact.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Onboarding / Tips Card */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Tips</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                            <span className="flex h-2 w-2 translate-y-1.5 rounded-full bg-sky-500" />
                            <p>Import your contacts via CSV to get started quickly.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="flex h-2 w-2 translate-y-1.5 rounded-full bg-sky-500" />
                            <p>Create an automation to welcome new subscribers automatically.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="flex h-2 w-2 translate-y-1.5 rounded-full bg-sky-500" />
                            <p>Verify your domain in Resend to ensure high deliverability.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
