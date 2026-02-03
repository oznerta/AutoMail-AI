
export default function ApiIngestPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">Ingest API</h1>
                <p className="text-lg text-muted-foreground">
                    Add contacts to your CRM from external sources.
                </p>
            </div>

            <p>
                Use this endpoint to push leads from your landing pages, forms, or other applications.
                Adding a contact via this API will trigger any automations configured with the &quot;Contact Added&quot; trigger.
            </p>

            <div className="rounded-md border p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2 font-mono text-sm">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">POST</span>
                    <span>/api/ingest</span>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Request Body</h3>
                <p>Send a JSON body with the contact details.</p>
                <div className="rounded-md bg-zinc-950 p-4 overflow-x-auto">
                    <pre className="text-sm text-zinc-50">
                        {`{
  "email": "user@example.com",     // Required
  "first_name": "John",
  "last_name": "Doe",
  "company": "Acme Inc",
  "tags": ["web-lead", "q1-campaign"],
  "custom_field_1": "value"        // Any extra fields are stored as custom_fields
}`}
                    </pre>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Example Request</h3>
                <div className="rounded-md bg-zinc-950 p-4 overflow-x-auto">
                    <pre className="text-sm text-zinc-50">
                        {`curl -X POST "https://your-domain.com/api/ingest?key=YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "newlead@example.com",
    "first_name": "Alice"
  }'`}
                    </pre>
                </div>
            </div>

        </div>
    )
}
