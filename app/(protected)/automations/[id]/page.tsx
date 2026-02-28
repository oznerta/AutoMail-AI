'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Automation, updateAutomation, getAutomation, generateWebhookToken } from "../actions"
import { getSenderIdentities } from "../../settings/actions"
import { getTemplates } from "../../email-builder/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, ArrowLeft, Play, Pause, Trash2, Plus, Zap, AlertCircle, Copy, Check, Tag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

// Types for our local state
type TriggerConfig = {
    type: '' | 'contact_added' | 'tag_added' | 'webhook_received' | 'event';
    config: any;
}

type Step = {
    id: string;
    type: 'send_email' | 'delay' | 'add_tag';
    config: any;
}

export default function AutomationEditorPage({ params }: { params: { id: string } }) {
    const { id } = params
    const [automation, setAutomation] = useState<Automation | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [trigger, setTrigger] = useState<TriggerConfig>({ type: '', config: {} })
    const [steps, setSteps] = useState<Step[]>([])
    const [availableTags, setAvailableTags] = useState<string[]>([])
    const [senders, setSenders] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const router = useRouter()
    const { toast } = useToast()

    // Fetch Data
    useEffect(() => {
        const load = async () => {
            try {
                const data = await getAutomation(id)
                if (data) {
                    setAutomation(data)
                    // Initialize local state from DB JSON
                    if (data.workflow_config) {
                        setTrigger(data.workflow_config.trigger || { type: '', config: {} })
                        setSteps(data.workflow_config.steps || [])
                    }
                }

                // Fetch tags for dropdown
                const tagsRes = await fetch('/api/tags');
                const tagsData = await tagsRes.json();
                if (tagsData.tags) setAvailableTags(tagsData.tags.map((t: any) => t.name));

                // Fetch Senders & Templates
                const [fetchedSenders, fetchedTemplates] = await Promise.all([
                    getSenderIdentities(),
                    getTemplates()
                ]);
                setSenders(fetchedSenders || []);
                setTemplates(fetchedTemplates || []);

            } catch (error) {
                console.error("Failed to load automation", error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    const handleSave = async () => {
        if (!automation) return
        setSaving(true)
        try {
            const workflowConfig = {
                trigger,
                steps
            }

            const result = await updateAutomation(automation.id, {
                name: automation.name,
                status: automation.status,
                trigger_type: trigger.type,
                workflow_config: workflowConfig
            })

            if (result.success) {
                toast({ title: "Saved", description: "Automation updated successfully." })
            } else {
                toast({ title: "Error", description: "Failed to save.", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const addStep = (type: 'send_email' | 'delay' | 'add_tag') => {
        const newStep: Step = {
            id: crypto.randomUUID(),
            type,
            config: type === 'delay' ? { value: 1, unit: 'days' } :
                type === 'add_tag' ? { tag: '' } :
                    { templateId: '' }
        }
        setSteps([...steps, newStep])
    }

    const updateStep = (id: string, updates: Partial<Step>) => {
        setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s))
    }

    const updateStepConfig = (id: string, configUpdates: any) => {
        setSteps(steps.map(s => s.id === id ? { ...s, config: { ...s.config, ...configUpdates } } : s))
    }

    const removeStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id))
    }

    // Copy to clipboard helper
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "Webhook URL copied to clipboard." });
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
    if (!automation) return <div className="p-8">Automation not found</div>

    // Construct Webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const webhookUrl = baseUrl
        ? `${baseUrl}/api/hooks/${automation.id}?token=${(automation as any).webhook_token || ''}`
        : '';

    return (
        <div className="flex flex-col gap-6 w-full mx-auto pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur z-20 py-4 border-b">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link href="/automations">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex flex-col">
                            <Input
                                value={automation.name}
                                onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
                                className="font-semibold text-lg h-8 border-transparent hover:border-input focus:border-input px-1 -ml-1 w-[300px]"
                            />
                            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                                <Badge variant={automation.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1">
                                    {automation.status.toUpperCase()}
                                </Badge>
                                <span>Last saved: {new Date(automation.updated_at).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border mr-2">
                            <Button
                                variant={automation.status === 'active' ? 'default' : 'ghost'}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setAutomation({ ...automation, status: 'active' })}
                            >
                                <Play className="h-3 w-3 mr-1" /> Active
                            </Button>
                            <Button
                                variant={automation.status === 'paused' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setAutomation({ ...automation, status: 'paused' })}
                            >
                                <Pause className="h-3 w-3 mr-1" /> Paused
                            </Button>
                        </div>

                        <Button onClick={handleSave} disabled={saving} size="sm">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            {/* Canvas / Timeline */}
            <div className="space-y-8 relative px-2 sm:px-4">
                {/* Visual Connector Line */}
                <div className="absolute left-6 sm:left-10 top-8 bottom-0 w-0.5 bg-border -z-10" />

                {/* --- TRIGGER CARD --- */}
                <div className="relative">
                    <div className="absolute left-0 sm:left-4 top-6 w-12 h-0.5 bg-border -z-10" />
                    <Card className="ml-10 sm:ml-16 border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="py-3 bg-muted/30">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                                    <Zap className="h-4 w-4" />
                                </div>
                                <span className="font-semibold text-sm">Trigger</span>
                            </div>
                        </CardHeader>
                        <CardContent className="py-4 space-y-4">
                            <div className="grid gap-2">
                                <Label>When this happens...</Label>
                                <Select
                                    value={trigger.type}
                                    onValueChange={async (val: any) => {
                                        setTrigger({ type: val, config: {} });

                                        // Auto-generate token if switching to webhook and it's missing
                                        if (val === 'webhook_received' && automation && !(automation as any).webhook_token) {
                                            toast({ title: "Generating Webhook Token...", description: "Setting up your secure webhook URL." });
                                            const res = await generateWebhookToken(automation.id);
                                            if (res.success && res.token) {
                                                setAutomation({ ...automation, webhook_token: res.token } as any);
                                                toast({ title: "Token Generated", description: "Your webhook is ready to use." });
                                            }
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Trigger" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="contact_added">Contact Added</SelectItem>
                                        <SelectItem value="tag_added">Tag Added</SelectItem>
                                        <SelectItem value="event">API Event (Ingest)</SelectItem>
                                        <SelectItem value="webhook_received">Webhook Received ⚡</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Trigger Specific Config */}
                            {trigger.type === 'event' && (
                                <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                                    <Label>Event Name</Label>
                                    <Input
                                        placeholder="e.g. user.signup"
                                        value={trigger.config.event || ''}
                                        onChange={(e) => setTrigger({ ...trigger, config: { event: e.target.value } })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Trigger this by sending <code>{"{ event: '"}{trigger.config.event || 'user.signup'}{"' }"}</code> to the Ingest API.
                                    </p>
                                </div>
                            )}

                            {trigger.type === 'tag_added' && (
                                <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                                    <Label>Which Tag?</Label>
                                    <Select
                                        value={trigger.config.tag || ''}
                                        onValueChange={(val) => setTrigger({ ...trigger, config: { tag: val } })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a Tag" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTags.map(tag => (
                                                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {trigger.type === 'webhook_received' && (
                                <div className="space-y-3 p-3 bg-muted/50 rounded-md border animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                        <Zap className="h-4 w-4" />
                                        Webhook URL
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Send a POST request with JSON body (includes `email`) to this URL to trigger this automation.
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-background p-2 rounded border text-xs break-all font-mono">
                                            {webhookUrl}
                                        </code>
                                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(webhookUrl)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {/* Token is auto-generated on selection if missing */}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* --- STEPS --- */}
                {steps.map((step, index) => (
                    <div key={step.id} className="relative group">
                        {/* Circle Number */}
                        <div className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-8 sm:w-12 flex justify-center">
                            <div className="w-8 h-8 rounded-full bg-background border-2 border-muted-foreground/30 text-xs font-medium text-muted-foreground flex items-center justify-center z-10">
                                {index + 1}
                            </div>
                        </div>

                        <Card className="ml-10 sm:ml-16 group-hover:border-primary/50 transition-colors">
                            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <div className="p-2 bg-secondary rounded-lg shrink-0">
                                    {step.type === 'send_email' ? '📧' : '⏱️'}
                                </div>
                                <div className="flex-1 space-y-1 w-full">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm">
                                            {step.type === 'send_email' ? 'Send Email' :
                                                step.type === 'add_tag' ? 'Add Tag' :
                                                    'Delay'}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeStep(step.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    {/* Config UI for Steps */}
                                    {step.type === 'delay' && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Wait for</span>
                                            <Input
                                                type="number"
                                                className="h-7 w-20 text-center"
                                                min="1"
                                                value={step.config.value || 1}
                                                onChange={(e) => updateStepConfig(step.id, { value: parseInt(e.target.value) })}
                                            />
                                            <Select
                                                value={step.config.unit || 'days'}
                                                onValueChange={(val) => updateStepConfig(step.id, { unit: val })}
                                            >
                                                <SelectTrigger className="h-7 w-24">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="minutes">Minutes</SelectItem>
                                                    <SelectItem value="hours">Hours</SelectItem>
                                                    <SelectItem value="days">Days</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {step.type === 'send_email' && (
                                        <div className="w-full space-y-3">
                                            <div className="grid gap-1.5">
                                                <Label className="text-xs">From (Sender)</Label>
                                                <Select
                                                    value={step.config.senderId || ''}
                                                    onValueChange={(val) => updateStepConfig(step.id, { senderId: val })}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="Select Sender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {senders.map(s => (
                                                            <SelectItem key={s.id} value={s.id}>
                                                                {s.name} &lt;{s.email}&gt;
                                                            </SelectItem>
                                                        ))}
                                                        {senders.length === 0 && <div className="p-2 text-xs text-muted-foreground text-center">No senders found. Go to Settings.</div>}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid gap-1.5">
                                                <Label className="text-xs">Email Template</Label>
                                                <Select
                                                    value={step.config.templateId || ''}
                                                    onValueChange={(val) => updateStepConfig(step.id, { templateId: val })}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="Select Template" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {templates.map(t => (
                                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                        ))}
                                                        {templates.length === 0 && <div className="p-2 text-xs text-muted-foreground text-center">No templates. Create one in Email Builder.</div>}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

                                    {step.type === 'add_tag' && (
                                        <div className="flex items-center gap-2 w-full">
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">Add Tag:</span>
                                            <Select
                                                value={step.config.tag || ''}
                                                onValueChange={(val) => updateStepConfig(step.id, { tag: val })}
                                            >
                                                <SelectTrigger className="h-8 text-sm w-full">
                                                    <SelectValue placeholder="Select Tag to Add" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableTags.map(tag => (
                                                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ))}

                {/* --- ADD STEP BUTTON --- */}
                <div className="ml-10 sm:ml-16 flex justify-center py-4 border-2 border-dashed rounded-lg border-muted/50 hover:bg-muted/10 transition-colors">
                    <div className="flex gap-2 flex-wrap justify-center">
                        <Button variant="outline" size="sm" onClick={() => addStep('delay')}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Delay
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addStep('send_email')}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Send Email
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addStep('add_tag')}>
                            <Tag className="h-3.5 w-3.5 mr-1" /> Add Tag
                        </Button>
                    </div>
                </div>

                {/* --- END NODE --- */}
                <div className="ml-10 sm:ml-16 flex justify-center pb-8">
                    <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground font-medium border">
                        End of Automation
                    </div>
                </div>

            </div>
        </div>
    )
}
