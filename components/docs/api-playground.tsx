"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, RotateCcw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

const DEFAULT_PAYLOADS = {
    ingest: JSON.stringify({
        email: "test_user@example.com",
        first_name: "Test",
        last_name: "User",
        event: "user.signup",
        custom_fields: {
            plan: "pro",
            source: "playground"
        }
    }, null, 2),
    webhook: JSON.stringify({
        email: "webhook_user@example.com",
        first_name: "Webhook",
        source: "external_trigger"
    }, null, 2)
}

export function ApiPlayground() {
    const { toast } = useToast()
    const [endpoint, setEndpoint] = useState<"ingest" | "webhook">("ingest")
    const [apiKey, setApiKey] = useState("")
    const [webhookToken, setWebhookToken] = useState("")
    const [payload, setPayload] = useState(DEFAULT_PAYLOADS.ingest)
    const [response, setResponse] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<number | null>(null)

    const handleEndpointChange = (value: "ingest" | "webhook") => {
        setEndpoint(value)
        setPayload(DEFAULT_PAYLOADS[value])
        setResponse(null)
        setStatus(null)
    }

    const executeRequest = async () => {
        setLoading(true)
        setResponse(null)
        setStatus(null)

        try {
            let url = ""
            let headers: any = {
                "Content-Type": "application/json"
            }

            if (endpoint === "ingest") {
                if (!apiKey) {
                    toast({
                        variant: "destructive",
                        title: "API Key Required",
                        description: "Please enter your API key to use the Ingest API."
                    })
                    setLoading(false)
                    return
                }
                // Construct URL with API Key query param to match spec, or header?
                // The route checks searchParams.get("key")
                url = `/api/ingest?key=${apiKey}`
            } else {
                if (!webhookToken) {
                    toast({
                        variant: "destructive",
                        title: "Token Required",
                        description: "Please enter a webhook token."
                    })
                    setLoading(false)
                    return
                }
                url = `/api/webhooks/${webhookToken}`
            }

            // Attempt to parse JSON to ensure validity before sending
            let parsedBody
            try {
                parsedBody = JSON.parse(payload)
            } catch (e) {
                toast({
                    variant: "destructive",
                    title: "Invalid JSON",
                    description: "Please check your payload syntax."
                })
                setLoading(false)
                return
            }

            const res = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(parsedBody)
            })

            setStatus(res.status)

            const data = await res.json()
            setResponse(data)

            if (res.ok) {
                toast({
                    title: "Request Successful",
                    description: `Status: ${res.status}`
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Request Failed",
                    description: `Status: ${res.status}. See response for details.`
                })
            }

        } catch (error: any) {
            setResponse({ error: error.message })
            toast({
                variant: "destructive",
                title: "Network Error",
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:h-[600px] border rounded-xl overflow-hidden bg-card shadow-sm">
            {/* Left Panel: Configuration */}
            <div className="flex flex-col border-b lg:border-b-0 lg:border-r bg-muted/10">
                <div className="p-4 border-b space-y-4">
                    <div className="space-y-2">
                        <Label>Endpoint</Label>
                        <Select value={endpoint} onValueChange={(v) => handleEndpointChange(v as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ingest">Ingest API (POST /api/ingest)</SelectItem>
                                <SelectItem value="webhook">Webhook Trigger (POST /api/webhooks/:token)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        {endpoint === "ingest" ? (
                            <>
                                <Label>API Key (Private Key)</Label>
                                <Input
                                    type="password"
                                    placeholder="sk_live_..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="font-mono text-sm"
                                />
                                <p className="text-[10px] text-muted-foreground">Found in Settings &gt; Developers</p>
                            </>
                        ) : (
                            <>
                                <Label>Webhook Token</Label>
                                <Input
                                    placeholder="Paste prompt URL token..."
                                    value={webhookToken}
                                    onChange={(e) => setWebhookToken(e.target.value)}
                                    className="font-mono text-sm"
                                />
                                <p className="text-[10px] text-muted-foreground">Found in Automation &gt; Trigger</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between">
                        <Label className="text-xs font-medium text-muted-foreground">Request Body (JSON)</Label>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setPayload(DEFAULT_PAYLOADS[endpoint])}
                            title="Reset to Default"
                        >
                            <RotateCcw className="h-3 w-3" />
                        </Button>
                    </div>
                    <Textarea
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                        className="flex-1 resize-none rounded-none border-0 focus-visible:ring-0 font-mono text-xs p-4 leading-relaxed"
                        spellCheck={false}
                    />
                </div>

                <div className="p-4 border-t bg-background">
                    <Button onClick={executeRequest} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                        Run Request
                    </Button>
                </div>
            </div>

            {/* Right Panel: Response */}
            <div className="flex flex-col bg-zinc-950 text-zinc-50 font-mono text-xs">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-900/50">
                    <span className="font-semibold text-zinc-400">Response</span>
                    {status && (
                        <Badge variant={status >= 200 && status < 300 ? "default" : "destructive"} className="h-5">
                            Status: {status}
                        </Badge>
                    )}
                </div>

                <div className="flex-1 p-4 overflow-auto">
                    {response ? (
                        <pre className="text-green-400 whitespace-pre-wrap break-all">
                            {JSON.stringify(response, null, 2)}
                        </pre>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                            <TerminalIcon className="h-8 w-8 opacity-20" />
                            <p>Waiting for request...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function TerminalIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" x2="20" y1="19" y2="19" />
        </svg>
    )
}
