"use client"

import { ApiPlayground } from "@/components/docs/api-playground"

export default function ApiPlaygroundPage() {
    return (
        <div className="space-y-6 max-w-[1200px]">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">API Playground</h1>
                <p className="text-muted-foreground text-lg">
                    Interactively test your integration with real requests.
                </p>
            </div>

            <div className="prose dark:prose-invert max-w-none">
                <p>
                    Use this tool to send test events to your project.
                    Changes made here <strong>will affect your live data</strong>.
                </p>
            </div>

            <ApiPlayground />
        </div>
    )
}
