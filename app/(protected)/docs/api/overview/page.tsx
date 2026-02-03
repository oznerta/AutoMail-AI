
export default function ApiOverviewPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">API Overview</h1>
                <p className="text-lg text-muted-foreground">
                    Authenticate and interact with the AutoMail AI API.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">Authentication</h2>
                <p>
                    All API requests must be authenticated using an API Key. You can generate API keys in the
                    <strong> Settings &gt; Developers</strong> tab.
                </p>
                <p>
                    Pass the API key as a query parameter <code>?key=YOUR_API_KEY</code> for GET/POST requests.
                </p>
                <div className="rounded-md bg-muted p-4">
                    <code className="text-sm">https://automail.ai/api/ingest?key=sk_live_...</code>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">Base URL</h2>
                <p>
                    The base URL for all API requests is your hosted domain:
                </p>
                <div className="rounded-md bg-muted p-4">
                    <code className="text-sm">https://your-domain.com/api</code>
                </div>
            </div>
        </div>
    )
}
