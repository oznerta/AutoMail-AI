'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Tag, Database, Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { AlertCircle, Tag as TagIcon, Database as DatabaseIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TagData {
    id: string;
    name: string;
    created_at: string;
}

interface CustomFieldDef {
    id: string;
    name: string;
    type: string;
    created_at: string;
}

export default function DataManagerPage() {
    const { toast } = useToast();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-lg font-semibold md:text-2xl">Fields & Tags</h1>
                <p className="text-sm text-muted-foreground">
                    Configure your data structures, tags, and custom fields.
                </p>
            </div>

            <Tabs defaultValue="tags" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="tags" className="gap-2">
                        <TagIcon className="h-4 w-4" /> Tags
                    </TabsTrigger>
                    <TabsTrigger value="fields" className="gap-2">
                        <DatabaseIcon className="h-4 w-4" /> Custom Fields
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tags" className="mt-6 space-y-6">
                    <Alert>
                        <TagIcon className="h-4 w-4" />
                        <AlertTitle>About Tags</AlertTitle>
                        <AlertDescription>
                            Use tags to group contacts (e.g. &quot;VIP&quot;, &quot;Lead&quot;, &quot;Newsletter&quot;). Tags are great for filtering and segmenting your lists.
                        </AlertDescription>
                    </Alert>
                    <TagsManager toast={toast} />
                </TabsContent>

                <TabsContent value="fields" className="mt-6 space-y-6">
                    <Alert>
                        <DatabaseIcon className="h-4 w-4" />
                        <AlertTitle>About Custom Fields</AlertTitle>
                        <AlertDescription>
                            Use custom fields to store specific details for every contact (e.g. &quot;Job Title&quot;, &quot;Birthday&quot;, &quot;Lead Score&quot;).
                            Defining a field here makes it available for all contacts.
                        </AlertDescription>
                    </Alert>
                    <CustomFieldsManager toast={toast} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ------------------------------------------------------------------
// Tags Manager Component
// ------------------------------------------------------------------
function TagsManager({ toast }: { toast: any }) {
    const [tags, setTags] = useState<TagData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const fetchTags = async () => {
        try {
            const res = await fetch('/api/tags');
            const data = await res.json();
            if (data.tags) setTags(data.tags);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleCreate = async () => {
        if (!newTagName.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTagName.trim() })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed');

            setTags([...tags, data.tag].sort((a, b) => a.name.localeCompare(b.name)));
            setNewTagName('');
            setIsCreateOpen(false);
            toast({ title: 'Tag Created', description: `Tag "${data.tag.name}" added.` });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete tag "${name}"? This removes it from all contacts.`)) return;
        try {
            await fetch(`/api/tags?id=${id}`, { method: 'DELETE' });
            setTags(tags.filter(t => t.id !== id));
            toast({ title: 'Tag Deleted', description: `Tag "${name}" removed.` });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete tag.', variant: 'destructive' });
        }
    };

    const startEdit = (tag: TagData) => {
        setEditingId(tag.id);
        setEditName(tag.name);
    }

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    }

    const saveEdit = async (id: string) => {
        try {
            const res = await fetch('/api/tags', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name: editName })
            });
            if (res.ok) {
                setTags(tags.map(t => t.id === id ? { ...t, name: editName } : t));
                setEditingId(null);
                toast({ title: "Tag Renamed" });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to rename tag.', variant: 'destructive' });
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Tags</CardTitle>
                    <CardDescription>Manage tags used to segment your contacts.</CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                            <Plus className="h-3.5 w-3.5" /> Create Tag
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Tag</DialogTitle>
                            <DialogDescription>Enter a unique name for this tag.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input
                                placeholder="e.g. VIP, Lead, Customer"
                                value={newTagName}
                                onChange={e => setNewTagName(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isSaving || !newTagName.trim()}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Tag'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : tags.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                        No tags found. Create one to get started.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {tags.map(tag => (
                            <div key={tag.id} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-muted/30 transition-colors group">
                                {editingId === tag.id ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <Input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => saveEdit(tag.id)}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={cancelEdit}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-primary/70" />
                                            <span className="font-medium text-sm">{tag.name}</span>
                                        </div>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => startEdit(tag)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(tag.id, tag.name)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ------------------------------------------------------------------
// Custom Fields Manager Component
// ------------------------------------------------------------------
function CustomFieldsManager({ toast }: { toast: any }) {
    const [fields, setFields] = useState<CustomFieldDef[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newFieldName, setNewFieldName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchFields = async () => {
        try {
            const res = await fetch('/api/data/definitions');
            const data = await res.json();
            if (data.definitions) setFields(data.definitions);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFields();
    }, []);

    const handleCreate = async () => {
        if (!newFieldName.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/data/definitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFieldName.trim(), type: 'text' })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed');

            setFields([...fields, data.definition].sort((a, b) => a.name.localeCompare(b.name)));
            setNewFieldName('');
            setIsCreateOpen(false);
            toast({ title: 'Field Defined', description: `Field "${data.definition.name}" acts as a blueprint.` });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete field "${name}"? \n\nWARNING: This will delete the value of "${name}" for ALL contacts. This cannot be undone.`)) return;
        try {
            await fetch(`/api/data/definitions?id=${id}`, { method: 'DELETE' });
            setFields(fields.filter(f => f.id !== id));
            toast({ title: 'Field Deleted', description: `Field definition "${name}" removed.` });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete field.', variant: 'destructive' });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Custom Field Definitions</CardTitle>
                    <CardDescription>
                        Define fields that should be available for all contacts.
                        Removing a field here deletes it from all contacts.
                    </CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                            <Plus className="h-3.5 w-3.5" /> Add Field
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Define New Field</DialogTitle>
                            <DialogDescription>
                                Create a standard field key (e.g. &quot;Job Title&quot;, &quot;Birthday&quot;).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input
                                placeholder="e.g. Job Title"
                                value={newFieldName}
                                onChange={e => setNewFieldName(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isSaving || !newFieldName.trim()}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Definition'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                        No custom fields defined.
                    </div>
                ) : (
                    <div className="border rounded-md divide-y">
                        {fields.map(field => (
                            <div key={field.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <Database className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{field.name}</p>
                                        <p className="text-xs text-muted-foreground">Type: {field.type}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(field.id, field.name)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
