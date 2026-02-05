import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
    title: "Campaigns | AutoMail AI Docs",
    description: "Send one-off broadcasts to specific segments.",
}

export default function CampaignsGuidePage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="space-y-2">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Campaigns
                </h1>
                <p className="text-xl text-muted-foreground">
                    Send newsletters, product updates, or announcements to your audience.
                </p>
            </div>

            <div className="space-y-12 pt-8">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Creating a Campaign</h2>
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                        <ol className="list-decimal list-inside space-y-2 text-sm md:text-base">
                            <li>Navigate to <span className="font-semibold text-primary">Campaigns</span>.</li>
                            <li>Click <span className="font-semibold">New Campaign</span>.</li>
                            <li><strong>Subject Line:</strong> Write a compelling subject. Supports variables!</li>
                            <li><strong>Content:</strong> Design your email using the visual builder or select a saved template.</li>
                        </ol>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Segmentation</h2>
                    <p className="text-muted-foreground">
                        You rarely want to email everyone. Use segments to target the right people.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border p-4">
                            <h4 className="font-bold mb-2">By Tag</h4>
                            <p className="text-sm text-muted-foreground">Send only to users with tag "Premium".</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <h4 className="font-bold mb-2">By Status</h4>
                            <p className="text-sm text-muted-foreground">Automatically excludes "Unsubscribed" or "Bounced" contacts.</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Scheduling</h2>
                    <p className="text-muted-foreground">
                        Once ready, you can send immediately or schedule it for a future date/time. Our scheduler handles timezones automatically (defaults to UTC).
                    </p>
                </section>
            </div>

            <div className="pt-10 flex justify-between">
                <Link href="/docs/guides/automations">
                    <Button variant="ghost">Back</Button>
                </Link>
                <Link href="/docs/api/overview">
                    <Button variant="outline">Next: API Reference</Button>
                </Link>
            </div>
        </div>
    )
}
