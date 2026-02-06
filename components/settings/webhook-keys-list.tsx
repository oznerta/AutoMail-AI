"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Copy, Trash2, Plus, AlertCircle, Check, Server, Terminal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createWebhookKey, revokeWebhookKey } from "@/app/(protected)/settings/actions"
import { Badge } from "@/components/ui/badge"

interface WebhookKey {
    id: string
    name: string
    key_prefix: string
    created_at: string
    last_used_at: string | null
}

interface WebhookKeysListProps {
    keys: WebhookKey[]
}

export function WebhookKeysList({ keys }: WebhookKeysListProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newKeyName, setNewKeyName] = useState("")
    const [createdKey, setCreatedKey] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [endpointCopied, setEndpointCopied] = useState(false)
    const [copied, setCopied] = useState(false)
    const [origin, setOrigin] = useState("")
    const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null)

    useEffect(() => {
        setOrigin(window.location.origin)
    }, [])

    const handleCreateWrapper = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        const result = await createWebhookKey(newKeyName)
        setIsLoading(false)

        if (result.success && result.key) {
            setCreatedKey(result.key)
            setNewKeyName("")
        } else {
            console.error(result.error)
        }
    }

    const handleRevokeConfirm = async () => {
        if (!keyToRevoke) return
        await revokeWebhookKey(keyToRevoke)
        setKeyToRevoke(null)
    }

    const copyToClipboard = () => {
        if (createdKey) {
            navigator.clipboard.writeText(createdKey)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleCloseDialog = () => {
        setIsCreateOpen(false)
        setCreatedKey(null)
        setNewKeyName("")
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>API Access</CardTitle>
                        <CardDescription>
                            Manage API keys for accessing the Ingest API and Automation Webhooks.
                            <br />
                            <a href="/docs" className="text-primary hover:underline" target="_blank">View Documentation &rarr;</a>
                        </CardDescription>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={(open) => {
                        if (!open && createdKey) handleCloseDialog()
                        else setIsCreateOpen(open)
                    }}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Key
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Ingest Key</DialogTitle>
                                <DialogDescription>
                                    Generate a new key to submit data to the API.
                                </DialogDescription>
                            </DialogHeader>

                            {!createdKey ? (
                                <form onSubmit={handleCreateWrapper} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="key-name">Key Name</Label>
                                        <Input
                                            id="key-name"
                                            placeholder="e.g. Website Contact Form"
                                            value={newKeyName}
                                            onChange={(e) => setNewKeyName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? "Generating..." : "Generate Key"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <Alert variant="destructive" className="bg-amber-50 text-amber-900 border-amber-200">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                        <AlertTitle className="text-amber-800">Save this key now</AlertTitle>
                                        <AlertDescription className="text-amber-700">
                                            This is the only time the full key will be displayed. If you lose it, you will need to generate a new one.
                                        </AlertDescription>
                                    </Alert>
                                    <div className="space-y-2">
                                        <Label>Your API Key</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={createdKey}
                                                readOnly
                                                className="font-mono text-sm"
                                            />
                                            <Button size="icon" variant="outline" onClick={copyToClipboard}>
                                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleCloseDialog}>Done</Button>
                                    </DialogFooter>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 1. Endpoint Display */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                    <h3 className="font-semibold leading-none tracking-tight">How to use</h3>
                    <p className="text-sm text-muted-foreground">
                        Use these keys to authenticate your requests. You can pass the key as a query parameter <code>?key=YOUR_KEY</code>.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="bg-muted p-4 rounded-md space-y-2">
                            <div className="text-xs font-semibold uppercase text-muted-foreground">Lead Ingestion</div>
                            <div className="font-mono text-xs break-all">POST /api/ingest?key=...</div>
                            <a href="/docs/api/ingest" className="text-xs text-primary hover:underline">Read Guide</a>
                        </div>
                        <div className="bg-muted p-4 rounded-md space-y-2">
                            <div className="text-xs font-semibold uppercase text-muted-foreground">Automation Trigger</div>
                            <div className="font-mono text-xs break-all">POST /api/automations/:id/trigger?key=...</div>
                            <a href="/docs/api/webhooks" className="text-xs text-primary hover:underline">Read Guide</a>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border">
                    <div className="relative w-full overflow-auto">
                        {keys.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                <div className="flex justify-center mb-3">
                                    <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <p>No API keys generated yet.</p>
                                <p className="text-xs opacity-70 mt-1">Create a key to start ingesting data.</p>
                            </div>
                        ) : (
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Key Prefix</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Last Used</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {keys.map((key) => (
                                        <tr key={key.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle font-medium">{key.name}</td>
                                            <td className="p-4 align-middle font-mono text-xs">{key.key_prefix}...</td>
                                            <td className="p-4 align-middle text-muted-foreground">
                                                {format(new Date(key.created_at), "MMM d, yyyy")}
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground">
                                                {key.last_used_at ? format(new Date(key.last_used_at), "MMM d, HH:mm") : "Never"}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setKeyToRevoke(key.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Revoke</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <AlertDialog open={!!keyToRevoke} onOpenChange={(open) => !open && setKeyToRevoke(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently revoke this API key. Any integration using it will stop working immediately.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRevokeConfirm} className="bg-destructive hover:bg-destructive/90">
                                Revoke Key
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    )
}
