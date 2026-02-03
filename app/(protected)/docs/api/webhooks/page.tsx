
export default function ApiWebhooksPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">Automation Webhooks</h1>
                <p className="text-lg text-muted-foreground">
                    Trigger specific automations programmatically.
                </p>
            </div>

            <p>
                Each automation workflow with a &quot;Webhook Received&quot; trigger can be executed by making a request to its unique endpoint.
                This is useful for custom integrations where you want to run a specific sequence of actions for a user.
            </p>

            <div className="rounded-md border p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2 font-mono text-sm">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">POST</span>
                    <span>/api/automations/:id/trigger</span>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Parameters</h3>
                <ul className="list-disc pl-6 space-y-2">
                    <li><code>:id</code> - The UUID of the automation you want to trigger. Found in the automation URL.</li>
                </ul>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Request Body</h3>
                <p>
                    You must provide existing contact identification (email or contact_id) so the automation knows who to act upon.
                    Any additional data in the JSON body will be available in the automation execution context.
                </p>
                <div className="rounded-md bg-zinc-950 p-4 overflow-x-auto">
                    <pre className="text-sm text-zinc-50">
                        {`{
  "email": "target@example.com",   // Required: Matches an existing contact
  "event_data": "subscription_upgraded",
  "plan": "pro"
}`}
                    </pre>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Example Request</h3>
                <div className="rounded-md bg-zinc-950 p-4 overflow-x-auto">
                    <pre className="text-sm text-zinc-50">
                        {`curl -X POST "https://your-domain.com/api/automations/123-abc/trigger?key=YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "customer@example.com",
    "item": "digital-course-v1"
  }'`}
                    </pre>
                </div>
            </div>
        </div>
    )
}
