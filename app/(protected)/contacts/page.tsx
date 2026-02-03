'use client'

import { ImportContactsDialog } from "./import-dialog";

import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/ui/tag-input";
import { PlusCircle, Trash2, Edit, Loader2, Search, Download } from "lucide-react";
import Papa from "papaparse";

type Contact = {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    company: string | null;
    tags: string[];
    custom_fields: Record<string, string>;
    status: 'active' | 'unsubscribed' | 'bounced';
    source: string | null;
    created_at: string;
};

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newContact, setNewContact] = useState({
        email: '',
        first_name: '',
        last_name: '',
        company: '',
        tags: [] as string[],
        custom_fields: {} as Record<string, string>,
    });

    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [fieldDefinitions, setFieldDefinitions] = useState<{ id: string, name: string }[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['email', 'first_name', 'last_name', 'company', 'tags', 'status']);

    const allColumns = [
        { id: 'email', label: 'Email', isCustom: false },
        { id: 'first_name', label: 'First Name', isCustom: false },
        { id: 'last_name', label: 'Last Name', isCustom: false },
        { id: 'company', label: 'Company', isCustom: false },
        { id: 'tags', label: 'Tags', isCustom: false },
        { id: 'status', label: 'Status', isCustom: false },
        { id: 'created_at', label: 'Created At', isCustom: false },
        ...fieldDefinitions.map(def => ({ id: def.name, label: def.name, isCustom: true }))
    ];

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const res = await fetch('/api/tags');
                const data = await res.json();
                if (data.tags) {
                    setAvailableTags(data.tags.map((t: any) => t.name));
                }
            } catch (error) {
                console.error("Failed to fetch tags:", error);
            }
        };
        fetchTags();
    }, [contacts]);

    // Fetch contacts and definitions
    const fetchContacts = async () => {
        try {
            const [contactsRes, defsRes] = await Promise.all([
                fetch('/api/contacts'),
                fetch('/api/data/definitions')
            ]);

            const contactsData = await contactsRes.json();
            if (contactsData.contacts) setContacts(contactsData.contacts);

            const defsData = await defsRes.json();
            if (defsData.definitions) setFieldDefinitions(defsData.definitions);

        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    // Add contact
    const handleAddContact = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newContact,
                    tags: newContact.tags,
                    custom_fields: newContact.custom_fields,
                }),
            });

            if (response.ok) {
                setIsAddDialogOpen(false);
                setNewContact({ email: '', first_name: '', last_name: '', company: '', tags: [], custom_fields: {} });
                fetchContacts();
            }
        } catch (error) {
            console.error('Failed to add contact:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Update contact
    const handleUpdateContact = async () => {
        if (!editingContact) return;
        setIsSaving(true);

        try {
            const response = await fetch(`/api/contacts/${editingContact.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editingContact,
                    tags: editingContact.tags,
                    custom_fields: editingContact.custom_fields,
                }),
            });

            if (response.ok) {
                setIsEditDialogOpen(false);
                setEditingContact(null);
                fetchContacts();
            }
        } catch (error) {
            console.error('Failed to update contact:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // ... (delete and other handlers remain same) ...

    // Helper to add/remove custom fields
    const updateCustomField = (
        isEditing: boolean,
        key: string,
        value: string,
        oldKey?: string
    ) => {
        const target = isEditing ? editingContact : newContact;
        const setTarget = isEditing ? setEditingContact : setNewContact;

        if (!target) return;

        const newFields = { ...(target.custom_fields || {}) };

        if (oldKey && oldKey !== key) {
            delete newFields[oldKey];
        }

        if (key) {
            newFields[key] = value;
        }

        setTarget({ ...target, custom_fields: newFields } as any);
    };

    const removeCustomField = (isEditing: boolean, key: string) => {
        const target = isEditing ? editingContact : newContact;
        const setTarget = isEditing ? setEditingContact : setNewContact;

        if (!target) return;

        const newFields = { ...(target.custom_fields || {}) };
        delete newFields[key];

        setTarget({ ...target, custom_fields: newFields } as any);
    };

    // Component for rendering custom fields inputs (Static based on definitions)
    const CustomFieldsEditor = ({ isEditing }: { isEditing: boolean }) => {
        const target = isEditing ? editingContact : newContact;
        const fields = target?.custom_fields || {};

        if (fieldDefinitions.length === 0) {
            return (
                <div className="text-xs text-muted-foreground text-center py-2 border border-dashed rounded-md">
                    No custom fields defined. Go to &quot;Fields &amp; Tags&quot; to add some.
                </div>
            );
        }

        return (
            <div className="space-y-3">
                <Label>Custom Fields</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto p-1">
                    {fieldDefinitions.map((def) => (
                        <div key={def.id} className="grid grid-cols-3 gap-2 items-center">
                            <Label className="text-xs text-muted-foreground truncate" title={def.name}>
                                {def.name}
                            </Label>
                            <Input
                                placeholder="Value"
                                className="h-8 text-xs col-span-2"
                                value={fields[def.name] || ''}
                                onChange={(e) => updateCustomField(isEditing, def.name, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // ... (Dialog rendering updates below) ...


    // Delete contact
    const handleDeleteContact = async (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // Prevent row click if we add one later
        if (!confirm('Are you sure you want to delete this contact?')) return;

        try {
            const response = await fetch(`/api/contacts/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchContacts();
            }
        } catch (error) {
            console.error('Failed to delete contact:', error);
        }
    };

    const openEditDialog = (contact: Contact) => {
        // Ensure tags is always an array
        const contactWithTagsArray = {
            ...contact,
            tags: Array.isArray(contact.tags) ? contact.tags : [],
        };
        setEditingContact(contactWithTagsArray);
        setIsEditDialogOpen(true);
    };

    // Helper to render tags with overflow handling
    const renderTags = (tags: string[]) => {
        const MAX_VISIBLE_TAGS = 2;
        const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
        const overflowCount = tags.length - MAX_VISIBLE_TAGS;

        return (
            <div className="flex gap-1 flex-wrap items-center">
                {visibleTags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs px-1.5 h-5">
                        {tag}
                    </Badge>
                ))}
                {overflowCount > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 h-5 text-muted-foreground">
                        +{overflowCount}
                    </Badge>
                )}
            </div>
        );
    };

    // Filter Logic
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleExport = () => {
        if (!filteredContacts.length) return;

        const csv = Papa.unparse(filteredContacts.map(c => ({
            Email: c.email,
            FirstName: c.first_name || '',
            LastName: c.last_name || '',
            Company: c.company || '',
            Tags: c.tags.join(', '),
            Status: c.status,
            Created: new Date(c.created_at).toLocaleDateString(),
            ...c.custom_fields
        })));

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Derived state for stats/options
    const allTags = Array.from(new Set(contacts.flatMap(c => c.tags || []))).sort();

    const filteredContacts = contacts.filter(contact => {
        // Search Filter
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            contact.email.toLowerCase().includes(searchLower) ||
            (contact.first_name?.toLowerCase() || '').includes(searchLower) ||
            (contact.last_name?.toLowerCase() || '').includes(searchLower) ||
            (contact.company?.toLowerCase() || '').includes(searchLower);

        // Status Filter
        const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

        // Tag Filter
        const matchesTag = tagFilter === 'all' || (contact.tags || []).includes(tagFilter);

        return matchesSearch && matchesStatus && matchesTag;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
    const paginatedContacts = filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, tagFilter]);

    return (
        <div className="flex flex-col gap-4">



            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Contacts</h1>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                        Manage your subscribers and leads.
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="gap-1 hidden sm:flex" onClick={handleExport} disabled={filteredContacts.length === 0}>
                        <Download className="h-3.5 w-3.5" />
                        Export CSV
                    </Button>
                    <ImportContactsDialog />
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-1 flex-1 sm:flex-none">
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span className="whitespace-nowrap">
                                    Add Contact
                                </span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Contact</DialogTitle>
                                <DialogDescription>
                                    Enter the contact details below.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newContact.email}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContact({ ...newContact, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">First Name</Label>
                                        <Input
                                            id="first_name"
                                            value={newContact.first_name}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContact({ ...newContact, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="last_name">Last Name</Label>
                                        <Input
                                            id="last_name"
                                            value={newContact.last_name}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContact({ ...newContact, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="company">Company</Label>
                                    <Input
                                        id="company"
                                        value={newContact.company}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContact({ ...newContact, company: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tags</Label>
                                    <TagInput
                                        value={newContact.tags}
                                        onChange={(tags) => setNewContact({ ...newContact, tags })}
                                        placeholder="Type and press Enter..."
                                        availableTags={availableTags}
                                    />
                                </div>
                                <div className="pt-2 border-t">
                                    <CustomFieldsEditor isEditing={false} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddContact} disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSaving ? 'Adding...' : 'Add Contact'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Contact</DialogTitle>
                                <DialogDescription>
                                    Update the contact details below.
                                </DialogDescription>
                            </DialogHeader>
                            {editingContact && (
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-email">Email *</Label>
                                        <Input
                                            id="edit-email"
                                            type="email"
                                            value={editingContact.email}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingContact({ ...editingContact, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-first_name">First Name</Label>
                                            <Input
                                                id="edit-first_name"
                                                value={editingContact.first_name || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingContact({ ...editingContact, first_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-last_name">Last Name</Label>
                                            <Input
                                                id="edit-last_name"
                                                value={editingContact.last_name || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingContact({ ...editingContact, last_name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-company">Company</Label>
                                        <Input
                                            id="edit-company"
                                            value={editingContact.company || ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingContact({ ...editingContact, company: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Tags</Label>
                                        <TagInput
                                            value={editingContact.tags}
                                            onChange={(tags) => setEditingContact({ ...editingContact, tags })}
                                            placeholder="Type and press Enter..."
                                            availableTags={availableTags}
                                        />
                                    </div>
                                    <div className="pt-2 border-t">
                                        <CustomFieldsEditor isEditing={true} />
                                    </div>
                                </div>
                            )}
                            <DialogFooter>
                                <Button onClick={handleUpdateContact} disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search contacts..."
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        className="h-10 w-full sm:w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="unsubscribed">Unsubscribed</option>
                        <option value="bounced">Bounced</option>
                    </select>

                    <select
                        className="h-10 w-full sm:w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                    >
                        <option value="all">All Tags</option>
                        {allTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {allColumns.map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    checked={visibleColumns.includes(column.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setVisibleColumns([...visibleColumns, column.id]);
                                        } else {
                                            setVisibleColumns(visibleColumns.filter((id) => id !== column.id));
                                        }
                                    }}
                                >
                                    {column.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {loading ? (
                <Card>
                    <CardContent>
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            ) : filteredContacts.length === 0 ? (
                <Card>
                    <CardContent>
                        <p className="text-center text-muted-foreground py-8">
                            {contacts.length === 0
                                ? 'No contacts yet. Click "Add Contact" to get started.'
                                : 'No contacts match your filters.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="hidden md:block overflow-x-auto">
                        <Card>
                            <CardContent className="p-0">
                                <Table className="min-w-full">
                                    <TableHeader>
                                        <TableRow>
                                            {allColumns.filter(col => visibleColumns.includes(col.id)).map(col => (
                                                <TableHead key={col.id} className="whitespace-nowrap px-4 py-3 h-10">
                                                    {col.label}
                                                </TableHead>
                                            ))}
                                            <TableHead className="text-right pr-6 whitespace-nowrap px-4 py-3 h-10">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedContacts.map((contact) => (
                                            <TableRow key={contact.id}>
                                                {allColumns.filter(col => visibleColumns.includes(col.id)).map(col => (
                                                    <TableCell key={col.id} className="whitespace-nowrap px-4 py-3">
                                                        {col.id === 'email' && <div className="font-medium text-sm break-all">{contact.email}</div>}
                                                        {col.id === 'first_name' && (contact.first_name || '-')}
                                                        {col.id === 'last_name' && (contact.last_name || '-')}
                                                        {col.id === 'company' && (contact.company || '-')}
                                                        {col.id === 'tags' && renderTags(contact.tags)}
                                                        {col.id === 'status' && (
                                                            <Badge className="text-xs" variant={contact.status === 'active' ? 'default' : 'outline'}>
                                                                {contact.status}
                                                            </Badge>
                                                        )}
                                                        {col.id === 'created_at' && new Date(contact.created_at).toLocaleDateString()}
                                                        {col.isCustom && (contact.custom_fields?.[col.id] || '-')}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-right pr-6 whitespace-nowrap px-4 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2"
                                                            onClick={() => openEditDialog(contact)}
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                            <span className="sr-only md:not-sr-only md:ml-1.5">Edit</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-destructive hover:text-destructive"
                                                            onClick={(e) => handleDeleteContact(contact.id, e)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            <span className="sr-only md:not-sr-only md:ml-1.5">Delete</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {/* Desktop Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t bg-card/50">
                                        <div className="text-xs text-muted-foreground mr-auto">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:hidden grid gap-3">
                        {paginatedContacts.map((contact) => (
                            <div key={contact.id} className="flex flex-col gap-2.5 p-3 border rounded-lg bg-card text-card-foreground shadow-sm">
                                {/* Always show Email and Status as header */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="font-semibold text-sm break-all">{contact.email}</div>
                                    <Badge
                                        className="text-[10px] shrink-0 h-5 px-1.5"
                                        variant={contact.status === 'active' ? 'default' : 'outline'}
                                    >
                                        {contact.status}
                                    </Badge>
                                </div>

                                {/* Dynamic Columns Loop */}
                                <div className="space-y-1">
                                    {allColumns
                                        .filter(col => visibleColumns.includes(col.id))
                                        .filter(col => col.id !== 'email' && col.id !== 'status') // Skip already shown
                                        .map(col => (
                                            <div key={col.id} className="text-sm">
                                                <span className="text-muted-foreground text-xs mr-2">{col.label}:</span>
                                                <span className="font-medium">
                                                    {col.id === 'first_name' && (contact.first_name || '-')}
                                                    {col.id === 'last_name' && (contact.last_name || '-')}
                                                    {col.id === 'company' && (contact.company || '-')}
                                                    {col.id === 'created_at' && new Date(contact.created_at).toLocaleDateString()}
                                                    {col.id === 'tags' && renderTags(contact.tags)}
                                                    {col.isCustom && (contact.custom_fields?.[col.id] || '-')}
                                                </span>
                                            </div>
                                        ))}
                                </div>

                                <div className="flex items-center justify-end pt-2 border-t gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => openEditDialog(contact)}
                                    >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDeleteContact(contact.id, e)}
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Del
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Mobile Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center space-x-2 py-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
