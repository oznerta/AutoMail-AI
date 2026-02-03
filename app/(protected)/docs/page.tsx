import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Terminal, Zap, Mail } from "lucide-react"
import Link from "next/link"

export const metadata = {
    title: "Documentation | AutoMail AI",
    description: "Learn how to integrate and use AutoMail AI.",
}

export default function DocsPage() {
    return (
        <div className="space-y-10 w-full">
            <section className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Documentation
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
                    Welcome to the AutoMail AI developer hub. Everything you need to capture leads, build automation workflows, and integrate with your existing stack.
                </p>
                <div className="flex gap-4 pt-4">
                    <Button asChild size="lg">
                        <Link href="/docs/guides/first-automation">
                            Get Started <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/docs/api/overview">
                            API Reference
                        </Link>
                    </Button>
                </div>
            </section>

            <section>
                <h2 className="mb-6 text-2xl font-semibold tracking-tight">Core Concepts</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Link href="/docs/api/ingest" className="group relative rounded-xl border p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Terminal className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Lead Ingestion</h3>
                        <p className="text-sm text-muted-foreground">
                            Learn how to push contacts from your website, forms, or applications directly into your CRM.
                        </p>
                    </Link>

                    <Link href="/docs/api/webhooks" className="group relative rounded-xl border p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Zap className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Automation Webhooks</h3>
                        <p className="text-sm text-muted-foreground">
                            Trigger specific workflows programmatically from your backend services.
                        </p>
                    </Link>

                    <Link href="/docs/guides/email-setup" className="group relative rounded-xl border p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <Mail className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Email Setup</h3>
                        <p className="text-sm text-muted-foreground">
                            Configure your sender identity and domain verification with Resend.
                        </p>
                    </Link>
                </div>
            </section>

            <section className="rounded-xl border bg-muted/30 p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Need help?</h2>
                        <p className="text-muted-foreground">
                            Stuck on something? Check out our guides or reach out to support.
                        </p>
                    </div>
                    <Button variant="secondary">Contact Support</Button>
                </div>
            </section>
        </div>
    )
}
