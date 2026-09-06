'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Campaign, updateCampaign } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save, ArrowLeft, Send, CheckCircle, Loader2, Users, Tag, Check, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CampaignBuilder({ campaign }: { campaign: Campaign }) {
    const router = useRouter();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("settings");
    const [isSaving, setIsSaving] = useState(false);
    const [showScheduleConfirm, setShowScheduleConfirm] = useState(false);

    // State
    const [name, setName] = useState(campaign.name);
    const [subject, setSubject] = useState(campaign.workflow_config?.subject || "");
    const [previewText, setPreviewText] = useState(campaign.workflow_config?.preview_text || "");
    const [content, setContent] = useState(campaign.email_template || "");
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
        campaign.scheduled_at ? new Date(campaign.scheduled_at) : undefined
    );
    const [scheduledTime, setScheduledTime] = useState("09:00");

    // Audience & Tag Segmentation State
    const [segmentType, setSegmentType] = useState<'all' | 'tag'>(campaign.segment_config?.type || 'all');
    const [selectedTags, setSelectedTags] = useState<string[]>(campaign.segment_config?.value || []);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [newTagInput, setNewTagInput] = useState("");

    useEffect(() => {
        fetch('/api/tags')
            .then(res => res.json())
            .then(data => {
                if (data.tags && Array.isArray(data.tags)) {
                    setAvailableTags(data.tags.map((t: { name: string }) => t.name));
                }
            })
            .catch(err => console.error("Failed to load tags:", err));
    }, []);

    const toggleTag = (tagName: string) => {
        if (selectedTags.includes(tagName)) {
            setSelectedTags(selectedTags.filter(t => t !== tagName));
        } else {
            setSelectedTags([...selectedTags, tagName]);
        }
    };

    const handleAddCustomTag = () => {
        const trimmed = newTagInput.trim();
        if (!trimmed) return;
        if (!selectedTags.includes(trimmed)) {
            setSelectedTags([...selectedTags, trimmed]);
        }
        if (!availableTags.includes(trimmed)) {
            setAvailableTags([...availableTags, trimmed]);
        }
        setNewTagInput("");
    };

    const hasChanges =
        name !== campaign.name ||
        subject !== (campaign.workflow_config?.subject || "") ||
        previewText !== (campaign.workflow_config?.preview_text || "") ||
        content !== (campaign.email_template || "") ||
        segmentType !== (campaign.segment_config?.type || 'all') ||
        JSON.stringify(selectedTags) !== JSON.stringify(campaign.segment_config?.value || []);

    const handleSave = async (silent = false) => {
        setIsSaving(true);
        try {
            await updateCampaign(campaign.id, {
                name,
                workflow_config: {
                    ...campaign.workflow_config,
                    subject,
                    preview_text: previewText
                },
                segment_config: {
                    type: segmentType,
                    value: segmentType === 'tag' ? selectedTags : []
                },
                email_template: content,
                scheduled_at: scheduledDate ? combineDateTime(scheduledDate, scheduledTime) : undefined
            });
            if (!silent) {
                toast({ title: "Saved", description: "Campaign updated successfully." });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to save campaign." });
        } finally {
            setIsSaving(false);
        }
    };

    const combineDateTime = (date: Date, time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        return newDate.toISOString();
    };

    const handleScheduleCheck = () => {
        if (!scheduledDate) {
            toast({ variant: "destructive", title: "Missing Date", description: "Please select a date to schedule this campaign." });
            return;
        }
        if (!subject) {
            toast({ variant: "destructive", title: "Missing Subject", description: "A subject line is required." });
            return;
        }
        if (!content) {
            toast({ variant: "destructive", title: "Missing Content", description: "Email content is required." });
            return;
        }
        if (segmentType === 'tag' && selectedTags.length === 0) {
            toast({ variant: "destructive", title: "Missing Tags", description: "Please select at least one tag or switch to All Contacts." });
            return;
        }

        setShowScheduleConfirm(true);
    };

    const handleScheduleConfirm = async () => {
        if (!scheduledDate) return;

        setIsSaving(true);
        try {
            await updateCampaign(campaign.id, {
                name,
                workflow_config: {
                    ...campaign.workflow_config,
                    subject,
                    preview_text: previewText
                },
                segment_config: {
                    type: segmentType,
                    value: segmentType === 'tag' ? selectedTags : []
                },
                email_template: content,
                status: 'scheduled',
                scheduled_at: combineDateTime(scheduledDate, scheduledTime)
            });
            toast({ title: "Scheduled", description: "Campaign scheduled successfully." });
            router.push('/campaigns');
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to schedule campaign." });
        } finally {
            setIsSaving(false);
            setShowScheduleConfirm(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/campaigns')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">{campaign.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{campaign.status}</Badge>
                            {hasChanges && <span className="text-amber-600 text-xs">Unsaved changes</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                    </Button>
                    <Button onClick={handleScheduleCheck} disabled={isSaving || campaign.status !== 'draft'}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Schedule
                    </Button>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                        Settings
                    </TabsTrigger>
                    <TabsTrigger value="audience" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                        Audience
                    </TabsTrigger>
                    <TabsTrigger value="content" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                        Content
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                        Schedule
                    </TabsTrigger>
                </TabsList>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Settings</CardTitle>
                            <CardDescription>Basic information and subject line.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="c-name">Internal Name</Label>
                                <Input id="c-name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
                                <p className="text-xs text-muted-foreground">Only visible to you.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="c-subject">Subject Line *</Label>
                                <Input id="c-subject" value={subject} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)} placeholder="e.g. Big News Inside!" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="c-preview">Preview Text</Label>
                                <Input id="c-preview" value={previewText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreviewText(e.target.value)} placeholder="Optional summary displayed in inbox" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Audience Tab */}
                <TabsContent value="audience" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" /> Target Audience
                            </CardTitle>
                            <CardDescription>Choose who should receive this campaign.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div
                                    onClick={() => setSegmentType('all')}
                                    className={cn(
                                        "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2",
                                        segmentType === 'all'
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border hover:border-muted-foreground/30 bg-card"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-base">All Contacts</span>
                                        {segmentType === 'all' && <Check className="h-5 w-5 text-primary" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Broadcast this email to all active subscribers in your database.
                                    </p>
                                </div>

                                <div
                                    onClick={() => setSegmentType('tag')}
                                    className={cn(
                                        "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2",
                                        segmentType === 'tag'
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border hover:border-muted-foreground/30 bg-card"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-base">Segment by Tags</span>
                                        {segmentType === 'tag' && <Check className="h-5 w-5 text-primary" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Deliver only to contacts that match specific assigned tags.
                                    </p>
                                </div>
                            </div>

                            {segmentType === 'tag' && (
                                <div className="space-y-4 pt-4 border-t">
                                    <div>
                                        <Label className="text-sm font-semibold">Select Target Tags</Label>
                                        <p className="text-xs text-muted-foreground mb-3">
                                            Contacts containing ANY of the selected tags will be included.
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {availableTags.length === 0 ? (
                                                <p className="text-xs text-muted-foreground italic">
                                                    No existing tags found in database. Add a custom tag below.
                                                </p>
                                            ) : (
                                                availableTags.map(tag => {
                                                    const isSelected = selectedTags.includes(tag);
                                                    return (
                                                        <Badge
                                                            key={tag}
                                                            variant={isSelected ? "default" : "outline"}
                                                            className={cn(
                                                                "cursor-pointer px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5",
                                                                isSelected
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "hover:bg-muted"
                                                            )}
                                                            onClick={() => toggleTag(tag)}
                                                        >
                                                            <Tag className="h-3 w-3" />
                                                            {tag}
                                                            {isSelected && <X className="h-3 w-3 ml-0.5" />}
                                                        </Badge>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 max-w-sm">
                                        <Input
                                            placeholder="Add or create tag name..."
                                            value={newTagInput}
                                            onChange={(e) => setNewTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCustomTag();
                                                }
                                            }}
                                            className="h-9 text-xs"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleAddCustomTag}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Add
                                        </Button>
                                    </div>

                                    <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                                        <p className="font-medium text-foreground">
                                            Selected Audience:{" "}
                                            {selectedTags.length > 0 ? (
                                                <span className="text-primary font-semibold">
                                                    {selectedTags.join(", ")}
                                                </span>
                                            ) : (
                                                <span className="text-destructive font-semibold">
                                                    No tags selected (Select at least one)
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Content Tab (Simple Editor) */}
                <TabsContent value="content" className="mt-6 flex-1 h-full flex gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                        <Label>HTML Content</Label>
                        <Textarea
                            className="flex-1 font-mono text-sm"
                            value={content}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                            placeholder="<h1>Write your email here...</h1>"
                        />
                        <p className="text-xs text-muted-foreground">Basic HTML supported. Use inline styles for best results.</p>
                    </div>
                    {/* Preview Pane */}
                    <Card className="flex-1 flex flex-col overflow-hidden bg-slate-50 border-dashed">
                        <div className="p-2 bg-white border-b text-xs font-semibold text-center text-muted-foreground">
                            Preview
                        </div>
                        <div className="flex-1 p-4 overflow-auto flex items-center justify-center">
                            <div className="bg-white shadow-sm min-h-[400px] w-full max-w-[600px] rounded border overflow-hidden">
                                <iframe
                                    title="Campaign Preview"
                                    srcDoc={content || '<div style="font-family:sans-serif;color:#888;padding:24px;text-align:center;">Preview will appear here...</div>'}
                                    className="w-full h-[400px] border-none bg-white"
                                    sandbox="allow-same-origin"
                                />
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* Schedule Tab */}
                <TabsContent value="schedule" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Review & Schedule</CardTitle>
                            <CardDescription>Pick a time to launch this campaign.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <div className="border rounded-md p-4 w-fit">
                                        <Calendar
                                            mode="single"
                                            selected={scheduledDate}
                                            onSelect={setScheduledDate}
                                            initialFocus
                                            disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4 max-w-sm">
                                    <div className="grid gap-2">
                                        <Label>Time</Label>
                                        <Input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScheduledTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="border-l-2 border-primary pl-4 py-2 space-y-1 bg-muted/30 rounded-r-md">
                                        <p className="font-semibold text-sm">Summary</p>
                                        <div className="text-sm">
                                            <p><span className="text-muted-foreground">Subject:</span> {subject || <span className="text-red-500">Missing</span>}</p>
                                            <p>
                                                <span className="text-muted-foreground">Recipients:</span>{" "}
                                                {segmentType === 'all'
                                                    ? "All Active Contacts"
                                                    : selectedTags.length > 0
                                                        ? `Tagged with: ${selectedTags.join(", ")}`
                                                        : <span className="text-red-500">No tags selected</span>}
                                            </p>
                                            <p><span className="text-muted-foreground">Schedule:</span> {scheduledDate ? `${format(scheduledDate, 'PPT')} at ${scheduledTime}` : 'Not set'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AlertDialog open={showScheduleConfirm} onOpenChange={setShowScheduleConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Schedule Campaign?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will schedule the campaign to be sent at the selected time. You can cancel it before it starts sending.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleScheduleConfirm}>
                            Schedule
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
