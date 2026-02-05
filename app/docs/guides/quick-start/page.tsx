import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
    title: "Quick Start | AutoMail AI Docs",
    description: "Send your first automated email in 5 minutes.",
}

export default function QuickStartPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="space-y-2">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Quick Start
                </h1>
                <p className="text-xl text-muted-foreground">
                    Send your first automated email in 5 minutes.
                </p>
            </div>

            <div className="space-y-12 pt-8">
                {/* Step 1 */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">1. Import Contacts</h2>
                    <p className="text-muted-foreground">
                        Before you can send emails, you need an audience. You can add contacts manually or import a CSV.
                    </p>
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                        <ol className="list-decimal list-inside space-y-2 text-sm md:text-base">
                            <li>Navigate to the <span className="font-semibold text-primary">Contacts</span> page.</li>
                            <li>Click the <span className="font-semibold">Import CSV</span> button.</li>
                            <li>Upload your CSV file (make sure it has an <code>email</code> column).</li>
                            <li>Map the columns to AutoMail's fields and confirm import.</li>
                        </ol>
                    </div>
                </section>

                {/* Step 2 */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">2. Create an Email Template</h2>
                    <p className="text-muted-foreground">
                        Design the email you want to send. Our AI builder makes this easy.
                    </p>
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                        <ol className="list-decimal list-inside space-y-2 text-sm md:text-base">
                            <li>Go to <span className="font-semibold text-primary">Email Templates</span>.</li>
                            <li>Click <span className="font-semibold">New Template</span>.</li>
                            <li>Use the AI Chat to generate content (e.g., <em>"Write a welcome email for new users"</em>).</li>
                            <li>Insert personalization variables like <code>{"{{first_name}}"}</code> to make it dynamic.</li>
                            <li>Click <span className="font-semibold text-green-500">Save Template</span>.</li>
                        </ol>
                    </div>
                </section>

                {/* Step 3 */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">3. Build an Automation</h2>
                    <p className="text-muted-foreground">
                        Connect your trigger to your email template.
                    </p>
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                        <ol className="list-decimal list-inside space-y-2 text-sm md:text-base">
                            <li>Navigate to <span className="font-semibold text-primary">Automations</span>.</li>
                            <li>Create a new automation and give it a name (e.g., "Welcome Sequence").</li>
                            <li>Select a <span className="font-semibold">Trigger</span>. For testing, choose "Webhook" (Automatic).</li>
                            <li>Add a new step and select <span className="font-semibold">Send Email</span>.</li>
                            <li>Choose the template you created in Step 2.</li>
                            <li>Save and <span className="font-semibold text-green-500">Activate</span> the automation.</li>
                        </ol>
                    </div>
                </section>

                {/* Step 4 */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">4. Test It</h2>
                    <p className="text-muted-foreground">
                        Trigger the automation to see it in action.
                    </p>
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                        <p>
                            If you chose "Webhook" ensuring you have the URL:
                        </p>
                        <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                            <code>
                                {`curl -X POST https://automailai.vercel.app/api/webhooks/YOUR_TOKEN \\
  -H "Content-Type: application/json" \\
  -d '{ "email": "you@example.com", "first_name": "Developer" }'`}
                            </code>
                        </pre>
                        <p className="text-sm text-muted-foreground">
                            Check your inbox! You should receive the personalized welcome email.
                        </p>
                    </div>
                </section>
            </div>

            <div className="pt-10">
                <Link href="/docs/guides/contacts">
                    <Button variant="outline">Next: Managing Contacts</Button>
                </Link>
            </div>
        </div>
    )
}
