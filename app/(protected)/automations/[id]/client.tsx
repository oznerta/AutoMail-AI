"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Play, Pause, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { TriggerPanel } from "./trigger-panel"
import { SequenceBuilder } from "./sequence-builder"
import { updateAutomation } from "../actions"
import { Badge } from "@/components/ui/badge"

export function AutomationEditorClient({
    automation,
    templates,
    availableTags = []
}: {
    automation: any,
    templates: any[],
    availableTags?: string[]
}) {
    const [config, setConfig] = useState(automation.workflow_config || { trigger: {}, steps: [] })
    const [name, setName] = useState(automation.name)
    const [status, setStatus] = useState(automation.status)
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    // Ensuring steps array exists
    if (!config.steps) config.steps = [];
    if (!config.trigger) config.trigger = {};

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateAutomation(automation.id, {
                name,
                status,
                workflow_config: config,
                trigger_type: config.trigger.event || null
            })
            toast({
                title: "Saved",
                description: "Automation workflow updated."
            })
            router.refresh()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save changes.",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    const toggleStatus = async () => {
        const newStatus = status === 'active' ? 'paused' : 'active'
        setStatus(newStatus)
        // Auto save on toggle
        await updateAutomation(automation.id, { status: newStatus })
        toast({
            title: newStatus === 'active' ? "Automation Activated" : "Automation Paused",
            description: `Workflow is now ${newStatus}.`
        })
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-2rem)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/automations')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-lg font-semibold h-8 px-0 border-transparent hover:border-input focus:border-input transition-colors w-[300px]"
                        />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {status === 'active' ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1"><Play className="h-3 w-3" /> Active</Badge>
                            ) : (
                                <Badge variant="secondary" className="gap-1"><Pause className="h-3 w-3" /> Paused</Badge>
                            )}
                            <span>• {config.steps.length} steps</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={toggleStatus}>
                        {status === 'active' ? "Pause" : "Activate"}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Main Builder Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
                {/* Left: Trigger Configuration */}
                <div className="lg:col-span-4 overflow-y-auto pr-2 pb-10">
                    <TriggerPanel
                        config={config}
                        onChange={setConfig}
                        availableTags={availableTags}
                    />
                </div>

                {/* Right: Sequence Steps */}
                <div className="lg:col-span-8 bg-muted/20 border rounded-xl overflow-y-auto p-6 relative">
                    <div className="max-w-3xl mx-auto">
                        <SequenceBuilder
                            steps={config.steps}
                            onChange={(steps) => setConfig({ ...config, steps })}
                            templates={templates}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
