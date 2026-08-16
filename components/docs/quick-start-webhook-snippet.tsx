"use client";

import { useOrigin } from "@/hooks/use-origin";

export function QuickStartWebhookSnippet() {
    const origin = useOrigin();

    return (
        <pre className="bg-muted p-4 rounded-md overflow-x-auto">
            <code>
                {`curl -X POST ${origin}/api/webhooks/YOUR_TOKEN \\
  -H "Content-Type: application/json" \\
  -d '{ "email": "you@example.com", "first_name": "Developer" }'`}
            </code>
        </pre>
    );
}
