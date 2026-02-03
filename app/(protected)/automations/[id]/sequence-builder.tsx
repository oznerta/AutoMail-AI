"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Plus,
    Mail,
    Clock,
    Trash2,
    MoreVertical,
    GripVertical,
    ArrowDown,
    Tag
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function SequenceBuilder({
    steps,
    onChange,
    templates = []
}: {
    steps: any[],
    onChange: (steps: any[]) => void,
    templates: any[]
}) {

    const addStep = (type: 'email' | 'delay' | 'add_tag') => {
        const newStep = {
            id: crypto.randomUUID(),
            type,
            config: type === 'delay' ? { value: 24, unit: 'hours' } :
                type === 'add_tag' ? { tag: '' } :
                    { template_id: '' }
        }
        onChange([...steps, newStep])
    }

    const removeStep = (index: number) => {
        const newSteps = [...steps]
        newSteps.splice(index, 1)
        onChange(newSteps)
    }

    const updateStep = (index: number, key: string, value: any) => {
        const newSteps = [...steps]
        newSteps[index] = {
            ...newSteps[index],
            config: {
                ...newSteps[index].config,
                [key]: value
            }
        }
        onChange(newSteps)
    }

    return (
        <div className="space-y-4 min-h-[500px]">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs">2</span>
                    Sequence Steps
                </h3>
                {/* <span className="text-xs text-muted-foreground">Drag to reorder (Coming soon)</span> */}
            </div>

            <div className="space-y-0 relative pb-12">
                {/* Connecting Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border -z-10" />

                {steps.map((step, index) => (
                    <div key={step.id} className="relative group">
                        <div className="flex items-start gap-4 pt-4">
                            {/* Node Connectors */}
                            <div className="mt-6 w-10 h-[2px] bg-border absolute -left-0 hidden" /> {/* Horizontal connector concept if needed */}

                            <div className="absolute left-[13px] top-[34px] w-3 h-3 rounded-full bg-background border-2 border-primary z-10" />

                            <Card className="flex-1 ml-10 border-l-4 border-l-primary/50 relative overflow-hidden group-hover:border-l-primary transition-colors">
                                <CardContent className="p-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-md ${step.type === 'email' ? 'bg-blue-100 text-blue-600' :
                                                step.type === 'add_tag' ? 'bg-green-100 text-green-600' :
                                                    'bg-amber-100 text-amber-600'
                                                }`}>
                                                {step.type === 'email' ? <Mail className="h-4 w-4" /> :
                                                    step.type === 'add_tag' ? <Tag className="h-4 w-4" /> :
                                                        <Clock className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                                                    {step.type === 'email' ? 'Send Email' :
                                                        step.type === 'add_tag' ? 'Add Tag' :
                                                            'Wait Delay'}
                                                </h4>
                                                {/* <p className="text-xs text-muted-foreground">Step {index + 1}</p> */}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="text-destructive" onClick={() => removeStep(index)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Step
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Config Body */}
                                    {step.type === 'email' && (
                                        <div className="space-y-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Select Template</Label>
                                                <Select
                                                    value={step.config.template_id}
                                                    onValueChange={(val) => updateStep(index, 'template_id', val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose email..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {templates.map(t => (
                                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                        ))}
                                                        {templates.length === 0 && <SelectItem value="none" disabled>No templates found</SelectItem>}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">From (Optional)</Label>
                                                <Select disabled>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Default System Sender" />
                                                    </SelectTrigger>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

                                    {step.type === 'add_tag' && (
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Tag Name</Label>
                                            <Input
                                                placeholder="e.g. visited_pricing"
                                                value={step.config.tag || ''}
                                                onChange={(e) => updateStep(index, 'tag', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {step.type === 'delay' && (
                                        <div className="flex items-end gap-3">
                                            <div className="space-y-1.5 flex-1">
                                                <Label className="text-xs">Wait For</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={step.config.value}
                                                    onChange={(e) => updateStep(index, 'value', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5 flex-1">
                                                <Select
                                                    value={step.config.unit}
                                                    onValueChange={(val) => updateStep(index, 'unit', val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="minutes">Minutes</SelectItem>
                                                        <SelectItem value="hours">Hours</SelectItem>
                                                        <SelectItem value="days">Days</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        {/* Down Arrow between steps */}
                        {index < steps.length - 1 && (
                            <div className="ml-[14px] my-2 text-border">
                                <ArrowDown className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Add Step Button */}
                <div className="mt-8 ml-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 border-dashed">
                                <Plus className="h-4 w-4" /> Add Step
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => addStep('email')}>
                                <Mail className="mr-2 h-4 w-4" /> Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addStep('delay')}>
                                <Clock className="mr-2 h-4 w-4" /> Wait / Delay
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addStep('add_tag')}>
                                <Tag className="mr-2 h-4 w-4" /> Add Tag
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
