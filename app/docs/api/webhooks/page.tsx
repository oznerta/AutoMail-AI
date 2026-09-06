"use client";

import { useOrigin } from "@/hooks/use-origin";

export default function ApiWebhooksPage() {
    const origin = useOrigin();

    return (
        <div className="space-y-10 max-w-4xl">
            <div className="space-y-2">
                <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">Webhooks & Inbound APIs</h1>
                <p className="text-lg text-muted-foreground">
                    Connect external triggers, ingest contacts, and capture real-time email delivery events.
                </p>
            </div>

            {/* Section 1: Automation Trigger */}
            <div className="space-y-4 border-b border-border/50 pb-8">
                <div className="flex items-center gap-3">
                    <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded">Outbound Integration</span>
                    <h2 className="text-2xl font-bold tracking-tight">1. Automation Trigger Webhook</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    Trigger custom automated sequences programmatically for a specific contact. If the contact does not yet exist,
                    AutoMail AI will automatically register them.
                </p>

                <div className="rounded-md border p-4 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2 font-mono text-sm">
                        <span className="bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded font-bold">POST</span>
                        <span>/api/automations/:id/trigger</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-base font-semibold">Parameters & Authentication</h3>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                        <li><code>:id</code> — UUID of the target automation.</li>
                        <li><code>?key=YOUR_API_KEY</code> or header <code>Authorization: Bearer YOUR_API_KEY</code>.</li>
                    </ul>
                </div>

                <div className="space-y-2">
                    <h3 className="text-base font-semibold">Payload Example</h3>
                    <div className="rounded-md bg-zinc-950 p-4 overflow-x-auto">
                        <pre className="text-sm text-zinc-50">
                            {`curl -X POST "${origin}/api/automations/YOUR_AUTOMATION_ID/trigger" \\
  -H "Authorization: Bearer sk_automail_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "sarah.connor@example.com",
    "first_name": "Sarah",
    "plan": "enterprise_tier"
  }'`}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Section 2: Contact Ingest & Event API */}
            <div className="space-y-4 border-b border-border/50 pb-8">
                <div className="flex items-center gap-3">
                    <span className="bg-cyan-500/10 text-cyan-500 text-xs font-semibold px-2.5 py-1 rounded">High-Throughput</span>
                    <h2 className="text-2xl font-bold tracking-tight">2. Universal Contact & Event Ingest</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    Stream leads and application events directly from your SaaS or landing pages. Protected by sliding-window rate limiting (120 requests/minute per key).
                </p>

                <div className="rounded-md border p-4 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2 font-mono text-sm">
                        <span className="bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded font-bold">POST</span>
                        <span>/api/ingest</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-base font-semibold">Rate Limit Headers</h3>
                    <p className="text-sm text-muted-foreground">
                        Every response includes standard RFC-compliant rate limit telemetry:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground font-mono">
                        <li>X-RateLimit-Limit: 120</li>
                        <li>X-RateLimit-Remaining: 118</li>
                        <li>X-RateLimit-Reset: 1725619200</li>
                        <li>Retry-After: 35 (on HTTP 429)</li>
                    </ul>
                </div>

                <div className="space-y-2">
                    <h3 className="text-base font-semibold">cURL Ingest Example</h3>
                    <div className="rounded-md bg-zinc-950 p-4 overflow-x-auto">
                        <pre className="text-sm text-zinc-50">
                            {`curl -X POST "${origin}/api/ingest" \\
  -H "Authorization: Bearer YOUR_WEBHOOK_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "alex@company.com",
    "first_name": "Alex",
    "company": "Acme Corp",
    "event": "user.signup",
    "tags": ["saas-trial", "onboarding"]
  }'`}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Section 3: Resend Inbound Delivery & Engagement Webhook */}
            <div className="space-y-4 pb-4">
                <div className="flex items-center gap-3">
                    <span className="bg-amber-500/10 text-amber-500 text-xs font-semibold px-2.5 py-1 rounded">Telemetry & Analytics</span>
                    <h2 className="text-2xl font-bold tracking-tight">3. Resend Delivery & Engagement Webhook</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    Receive delivery confirmations, opens, clicks, bounces, and spam complaints from Resend. AutoMail AI updates
                    campaign counters and cleans bad email addresses in real time.
                </p>

                <div className="rounded-md border p-4 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2 font-mono text-sm">
                        <span className="bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded font-bold">POST</span>
                        <span>/api/webhooks/resend</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-base font-semibold">Setup in Resend Dashboard</h3>
                    <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground">
                        <li>Navigate to <strong>Resend Dashboard &gt; Webhooks</strong>.</li>
                        <li>Click <strong>Add Webhook</strong> and set Endpoint URL to <code>{origin}/api/webhooks/resend</code>.</li>
                        <li>Select events: <code>email.delivered</code>, <code>email.opened</code>, <code>email.clicked</code>, <code>email.bounced</code>, and <code>email.complained</code>.</li>
                        <li>Copy the Signing Secret (starts with <code>whsec_...</code>) and save it in your environment as <code>RESEND_WEBHOOK_SECRET</code>.</li>
                    </ol>
                </div>

                <div className="space-y-3">
                    <h3 className="text-base font-semibold">Automatic State Synchronization</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 border rounded bg-card/50">
                            <p className="font-semibold text-foreground">email.delivered</p>
                            <p className="text-muted-foreground">Increments automation <code>total_sent</code> and sets contact <code>last_contacted_at</code>.</p>
                        </div>
                        <div className="p-3 border rounded bg-card/50">
                            <p className="font-semibold text-foreground">email.opened & email.clicked</p>
                            <p className="text-muted-foreground">Increments automation <code>total_opened</code> and <code>total_clicked</code> counters.</p>
                        </div>
                        <div className="p-3 border rounded bg-card/50">
                            <p className="font-semibold text-foreground">email.bounced</p>
                            <p className="text-muted-foreground">Increments <code>total_bounced</code> and marks contact <code>status = &apos;bounced&apos;</code>.</p>
                        </div>
                        <div className="p-3 border rounded bg-card/50">
                            <p className="font-semibold text-foreground">email.complained</p>
                            <p className="text-muted-foreground">Automatically transitions contact to <code>status = &apos;unsubscribed&apos;</code>.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
