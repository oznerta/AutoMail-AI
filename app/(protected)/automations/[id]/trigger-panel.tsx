"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Zap, AlertCircle } from "lucide-react"
import { TagInput } from "@/components/ui/tag-input"

export function TriggerPanel({ config, onChange, availableTags = [] }: { config: any, onChange: (c: any) => void, availableTags?: string[] }) {

    // Helper to safely update trigger settings
    const updateTrigger = (key: string, value: any) => {
        onChange({
            ...config,
            trigger: {
                ...config.trigger,
                [key]: value
            }
        })
    }

    const trigger = config.trigger || {}

    return (
        <div className="space-y-4">
            {/* 1. Trigger Selection */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <span className="font-bold text-sm">1</span>
                        </div>
                        <div>
                            <CardTitle className="text-base">Trigger</CardTitle>
                            <CardDescription>When this happens...</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Event Occurs</Label>
                        <Select
                            value={trigger.event || ""}
                            onValueChange={(val) => updateTrigger('event', val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an event..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="contact_added">Contact Added</SelectItem>
                                <SelectItem value="form_submitted">Form Submitted</SelectItem>
                                <SelectItem value="tag_added">Tag Added</SelectItem>
                                <SelectItem value="custom_webhook">Custom Webhook</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {trigger.event === 'tag_added' && (
                        <div className="space-y-2">
                            <Label>Which Tag?</Label>
                            <TagInput
                                placeholder="Select tags..."
                                value={Array.isArray(trigger.tag_filter) ? trigger.tag_filter : (trigger.tag_filter ? [trigger.tag_filter] : [])}
                                onChange={(tags) => updateTrigger('tag_filter', tags)}
                                availableTags={availableTags}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. Eligibility */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <Zap className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Eligibility</CardTitle>
                            <CardDescription>Who can enter?</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Required Tag (Optional)</Label>
                        <TagInput
                            placeholder="Must have tag..."
                            value={Array.isArray(trigger.required_tag) ? trigger.required_tag : (trigger.required_tag ? [trigger.required_tag] : [])}
                            onChange={(tags) => updateTrigger('required_tag', tags)}
                            availableTags={availableTags}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 3. Limits */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <AlertCircle className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Limits</CardTitle>
                            <CardDescription>Frequency control</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Scope</Label>
                        <Select
                            value={trigger.scope || "unlimited"}
                            onValueChange={(val) => updateTrigger('scope', val)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unlimited">Unlimited (Re-entry allowed)</SelectItem>
                                <SelectItem value="once_per_contact">Once per contact (Strict)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
