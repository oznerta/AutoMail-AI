import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
    title: "Automations | AutoMail AI Docs",
    description: "Build powerful workflows triggered by events.",
}

export default function AutomationsGuidePage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="space-y-2">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Automations
                </h1>
                <p className="text-xl text-muted-foreground">
                    Visual workflows to sequence your communication logic.
                </p>
            </div>

            <div className="space-y-12 pt-8">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">How it Works</h2>
                    <p className="text-muted-foreground">
                        An Automation consists of a <strong>Trigger</strong> followed by a linear sequence of <strong>Actions</strong>.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Triggers</h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="rounded-xl border bg-card p-6">
                            <h3 className="font-semibold text-lg mb-2">Webhook Trigger</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Generates a unique URL. Any POST request to this URL will start the automation for the email address in the payload.
                            </p>
                            <code className="text-xs bg-muted p-1 rounded">POST /v1/webhooks/token</code>
                        </div>
                        <div className="rounded-xl border bg-card p-6">
                            <h3 className="font-semibold text-lg mb-2">API Event Trigger</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Listen for named events sent via the Ingest API. For example, trigger when event = <code>"checkout_completed"</code>.
                            </p>
                            <code className="text-xs bg-muted p-1 rounded">POST /v1/ingest (event: ...)</code>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Actions</h2>
                    <ul className="space-y-4">
                        <li className="flex gap-4 items-start">
                            <span className="font-bold text-primary min-w-[100px]">Send Email</span>
                            <span className="text-muted-foreground">Dispatches a template. Variables are filled from the contact&apos;s data.</span>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="font-bold text-primary min-w-[100px]">Delay</span>
                            <span className="text-muted-foreground">Waits for a specified time (minutes, hours, days) before proceeding.</span>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="font-bold text-primary min-w-[100px]">Add Tag</span>
                            <span className="text-muted-foreground">Tags the contact (e.g., "Finished Welcome Sequence"). Useful for future segmentation.</span>
                        </li>
                    </ul>
                </section>
            </div>

            <div className="pt-10 flex justify-between">
                <Link href="/docs/guides/email-builder">
                    <Button variant="ghost">Back</Button>
                </Link>
                <Link href="/docs/guides/campaigns">
                    <Button variant="outline">Next: Campaigns</Button>
                </Link>
            </div>
        </div>
    )
}
