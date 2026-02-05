"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Terminal, Zap, Mail, Database, Bot } from "lucide-react"
import Link from "next/link"
import { SpotlightCard } from "@/components/ui/spotlight-card";

export default function DocsPage() {
    return (
        <div className="space-y-12 w-full max-w-[1200px]">
            {/* Hero Section */}
            <section className="relative space-y-6 py-8 md:py-12 lg:py-16">
                {/* Decor elements */}
                <div className="absolute top-0 right-0 -z-10 opacity-20 transform translate-x-1/3 -translate-y-1/3">
                    <div className="w-[500px] h-[500px] bg-primary/30 rounded-full blur-[100px]" />
                </div>

                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                    Documentation v2.0
                </div>

                <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
                    Build faster with <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-primary to-teal-400">
                        Intelligent Infrastructure.
                    </span>
                </h1>

                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                    Everything you need to integrate AutoMail AI into your stack.
                    From simple webhooks to complex multi-step automation workflows.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                    <Button asChild size="lg" className="rounded-full shadow-lg hover:shadow-primary/25 h-12 px-8 text-base">
                        <Link href="/docs/guides/quick-start">
                            Start Building <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-8 text-base bg-background/50 backdrop-blur-sm hover:bg-muted">
                        <Link href="/docs/api/overview">
                            API Reference
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Core Platform Section */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold tracking-tight">Core Platform</h2>
                    <div className="h-px flex-1 bg-border/50 ml-6 hidden sm:block"></div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Link href="/docs/guides/contacts" className="block h-full group">
                        <SpotlightCard className="h-full border bg-card/50 backdrop-blur-sm p-6 rounded-2xl hover:border-primary/50 transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Database className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">Contacts & Data</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Import contacts, manage custom fields, and segment your audience with precision.
                            </p>
                        </SpotlightCard>
                    </Link>

                    <Link href="/docs/guides/email-builder" className="block h-full group">
                        <SpotlightCard className="h-full border bg-card/50 backdrop-blur-sm p-6 rounded-2xl hover:border-primary/50 transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Mail className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">Email Builder</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Create responsive, brand-perfect templates using our AI-powered visual editor.
                            </p>
                        </SpotlightCard>
                    </Link>

                    <Link href="/docs/guides/automations" className="block h-full group">
                        <SpotlightCard className="h-full border bg-card/50 backdrop-blur-sm p-6 rounded-2xl hover:border-primary/50 transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Bot className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">Automations</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Design sophisticated, multi-step workflows triggered by real-time events.
                            </p>
                        </SpotlightCard>
                    </Link>
                </div>
            </section>

            {/* Developer Section */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold tracking-tight">For Developers</h2>
                    <div className="h-px flex-1 bg-border/50 ml-6 hidden sm:block"></div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                    <Link href="/docs/api/ingest" className="block h-full group">
                        <SpotlightCard className="h-full border bg-card/50 backdrop-blur-sm p-6 rounded-2xl hover:border-primary/50 transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Terminal className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 font-mono group-hover:text-primary transition-colors">Ingest API</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                High-throughput event ingestion. Push contacts and events directly from your backend.
                            </p>
                            <div className="mt-4 text-xs font-mono bg-muted/50 p-2 rounded text-muted-foreground">
                                POST https://automailai.vercel.app/api/ingest
                            </div>
                        </SpotlightCard>
                    </Link>

                    <Link href="/docs/api/webhooks" className="block h-full group">
                        <SpotlightCard className="h-full border bg-card/50 backdrop-blur-sm p-6 rounded-2xl hover:border-primary/50 transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Zap className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 font-mono group-hover:text-primary transition-colors">Webhooks</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Subscribe to platform events and trigger workflows programmatically in real-time.
                            </p>
                            <div className="mt-4 text-xs font-mono bg-muted/50 p-2 rounded text-muted-foreground">
                                secure_webhook_secret_key
                            </div>
                        </SpotlightCard>
                    </Link>
                </div>
            </section>
        </div>
    )
}
