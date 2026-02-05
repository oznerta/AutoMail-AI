import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
    title: "Contacts & Data | AutoMail AI Docs",
    description: "Manage your audience with contacts, tags, and custom fields.",
}

export default function ContactsGuidePage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="space-y-2">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Contacts & Data
                </h1>
                <p className="text-xl text-muted-foreground">
                    Your database needs to be clean and organized. Here is how to manage it.
                </p>
            </div>

            <div className="space-y-12 pt-8">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Importing Contacts</h2>
                    <p className="text-muted-foreground">
                        Bulk import contacts using CSV files. This is the fastest way to migrate from other tools like Mailchimp or HubSpot.
                    </p>
                    <div className="rounded-lg border bg-card p-6">
                        <h4 className="font-semibold mb-2">CSV Requirements</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Must have a header row.</li>
                            <li>Must contain an <code>email</code> column (case-insensitive detection).</li>
                            <li>Optional columns: <code>first_name</code>, <code>last_name</code>, <code>phone</code>.</li>
                            <li>Any other columns can be mapped to Custom Fields.</li>
                        </ul>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Custom Fields</h2>
                    <p className="text-muted-foreground">
                        Store additional data about your subscribers, like "Company", "Plan Tier", or "Signup Date".
                    </p>
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                        <p>To create a custom field:</p>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li>Go to <span className="font-semibold">Fields & Tags</span> {'>'} <span className="font-semibold">Custom Fields</span>.</li>
                            <li>Click <span className="font-semibold">Create Field</span>.</li>
                            <li>Enter a <strong>Key</strong> (e.g., <code>plan_tier</code>) and a Label.</li>
                            <li>Choose a type (Text, Number, Date, Boolean).</li>
                        </ol>
                        <p className="text-sm text-muted-foreground mt-2">
                            Once created, you can use these fields in Email Templates as <code>{"{{plan_tier}}"}</code>.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Tags and Segmentation</h2>
                    <p className="text-muted-foreground">
                        Use Tags to organize users into groups (e.g., "VIP", "Newsletter", "Churned").
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li><strong>Manual Tagging:</strong> Select contacts in the list and apply tags.</li>
                        <li><strong>Automated Tagging:</strong> Use the "Add Tag" action in Automation flows.</li>
                        <li><strong>API Tagging:</strong> Pass tags in the <code>POST /ingest</code> payload.</li>
                    </ul>
                </section>
            </div>

            <div className="pt-10 flex justify-between">
                <Link href="/docs/guides/quick-start">
                    <Button variant="ghost">Back</Button>
                </Link>
                <Link href="/docs/guides/email-builder">
                    <Button variant="outline">Next: Email Builder</Button>
                </Link>
            </div>
        </div>
    )
}
