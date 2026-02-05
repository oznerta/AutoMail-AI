import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
    title: "Email Builder | AutoMail AI Docs",
    description: "Create responsive, personalized email templates with AI.",
}

export default function EmailBuilderGuidePage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="space-y-2">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Email Builder
                </h1>
                <p className="text-xl text-muted-foreground">
                    Design beautiful, responsive emails using our split-screen editor and AI assistant.
                </p>
            </div>

            <div className="space-y-12 pt-8">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">The Editor Interface</h2>
                    <p className="text-muted-foreground">
                        The editor gives you full control. On the left, edit raw HTML/CSS. On the right, see a live preview that updates instantly.
                    </p>
                    {/* Add screenshot placeholder here if available later */}
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Using AI Generation</h2>
                    <p className="text-muted-foreground">
                        Don&apos;t start from scratch. Use the AI Chat panel to generate headers, buttons, or entire newsletters.
                    </p>
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                        <h4 className="font-semibold">Example Prompts:</h4>
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                            <li><em>"Create a minimalist announcement email for a new product feature."</em></li>
                            <li><em>"Add a call-to-action button that links to https://automail.ai/signup"</em></li>
                            <li><em>"Make the footer dark mode compatible."</em></li>
                        </ul>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Personalization Variables</h2>
                    <p className="text-muted-foreground">
                        Make every email unique. You can insert any contact property using Handlebars syntax.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-lg border bg-card p-4">
                            <h5 className="font-semibold mb-2">Standard Fields</h5>
                            <code className="block bg-muted p-1 rounded text-sm mb-1">{"{{first_name}}"}</code>
                            <code className="block bg-muted p-1 rounded text-sm mb-1">{"{{last_name}}"}</code>
                            <code className="block bg-muted p-1 rounded text-sm mb-1">{"{{email}}"}</code>
                        </div>
                        <div className="rounded-lg border bg-card p-4">
                            <h5 className="font-semibold mb-2">Custom Fields</h5>
                            <code className="block bg-muted p-1 rounded text-sm mb-1">{"{{company}}"}</code>
                            <code className="block bg-muted p-1 rounded text-sm mb-1">{"{{plan_tier}}"}</code>
                            <code className="block bg-muted p-1 rounded text-sm mb-1">{"{{your_custom_key}}"}</code>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Uploading Images</h2>
                    <p className="text-muted-foreground">
                        You can host images directly with us. Click the <span className="font-semibold">Image</span> icon in the toolbar to upload assets. We automatically optimize them for email clients.
                    </p>
                </section>
            </div>

            <div className="pt-10 flex justify-between">
                <Link href="/docs/guides/contacts">
                    <Button variant="ghost">Back</Button>
                </Link>
                <Link href="/docs/guides/automations">
                    <Button variant="outline">Next: Automations</Button>
                </Link>
            </div>
        </div>
    )
}
