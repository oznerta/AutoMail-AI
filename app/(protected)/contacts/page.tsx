'use client'

import { ImportContactsDialog } from "./import-dialog";
import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
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
import { useContacts, Contact } from "@/hooks/use-contacts";
import { useTags } from "@/hooks/use-tags";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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

export default function ContactsPage() {
    const {
        contacts = [],
        isLoading,
        addContact,
        updateContact,
        deleteContact,
        isAdding,
        isUpdating
    } = useContacts();

    const { tags: availableTags } = useTags();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newContact, setNewContact] = useState({
        email: '',
        first_name: '',
        last_name: '',
        company: '',
        tags: [] as string[],
        custom_fields: {} as Record<string, string>,
    });

    const [fieldDefinitions] = useState<{ id: string, name: string }[]>([]); // simplified for now
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

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<string | null>(null);

    // Add contact
    const handleAddContact = () => {
        addContact(newContact, {
            onSuccess: () => {
                setIsAddDialogOpen(false);
                setNewContact({ email: '', first_name: '', last_name: '', company: '', tags: [], custom_fields: {} });
            }
        });
    };

    // Update contact
    const handleUpdateContact = () => {
        if (!editingContact) return;
        updateContact(editingContact, {
            onSuccess: () => {
                setIsEditDialogOpen(false);
                setEditingContact(null);
            }
        });
    };

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

    // Component for rendering custom fields inputs (Static based on definitions)
    const CustomFieldsEditor = ({ isEditing }: { isEditing: boolean }) => {
        const target = isEditing ? editingContact : newContact;
        const fields = target?.custom_fields || {};

        if (fieldDefinitions.length === 0) {
            return (
                <div className="text-xs text-muted-foreground text-center py-2 border border-dashed rounded-md bg-muted/30">
                    No custom fields defined. Go to "Fields & Tags" to add some.
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

    // Delete contact
    // Delete contact - Open Confirmation
    const confirmDelete = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setContactToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirmed = () => {
        if (!contactToDelete) return;

        toast.promise(
            new Promise((resolve) => {
                deleteContact(contactToDelete, {
                    onSuccess: () => {
                        resolve(true);
                        setIsDeleteDialogOpen(false);
                        setContactToDelete(null);
                    }
                });
            }),
            {
                loading: 'Deleting...',
                success: 'Contact deleted',
                error: 'Failed to delete contact'
            }
        );
    };

    const openEditDialog = (contact: Contact) => {
        const contactWithTagsArray = {
            ...contact,
            tags: Array.isArray(contact.tags) ? contact.tags : [],
        };
        setEditingContact(contactWithTagsArray);
        setIsEditDialogOpen(true);
    };

    const renderTags = (tags: string[]) => {
        const MAX_VISIBLE_TAGS = 2;
        const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
        const overflowCount = tags.length - MAX_VISIBLE_TAGS;

        return (
            <div className="flex gap-1 flex-wrap items-center">
                {visibleTags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs px-1.5 h-5 bg-teal-100/50 text-teal-800 hover:bg-teal-100 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800">
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

    const allCurrentTags = Array.from(new Set(contacts.flatMap(c => c.tags || []))).sort();

    const filteredContacts = contacts.filter(contact => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            contact.email.toLowerCase().includes(searchLower) ||
            (contact.first_name?.toLowerCase() || '').includes(searchLower) ||
            (contact.last_name?.toLowerCase() || '').includes(searchLower) ||
            (contact.company?.toLowerCase() || '').includes(searchLower);

        const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
        const matchesTag = tagFilter === 'all' || (contact.tags || []).includes(tagFilter);

        return matchesSearch && matchesStatus && matchesTag;
    });

    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
    const paginatedContacts = filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, tagFilter]);

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Contacts</h1>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                        Manage your subscribers and leads.
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="gap-2 hidden sm:flex h-9" onClick={handleExport} disabled={filteredContacts.length === 0}>
                        <Download className="h-3.5 w-3.5" />
                        Export
                    </Button>
                    <ImportContactsDialog />
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 flex-1 sm:flex-none h-9 shadow-sm hover:shadow-md transition-all">
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span className="whitespace-nowrap">
                                    Add Contact
                                </span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
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
                                        className="h-9"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">First Name</Label>
                                        <Input
                                            id="first_name"
                                            value={newContact.first_name}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContact({ ...newContact, first_name: e.target.value })}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="last_name">Last Name</Label>
                                        <Input
                                            id="last_name"
                                            value={newContact.last_name}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContact({ ...newContact, last_name: e.target.value })}
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="company">Company</Label>
                                    <Input
                                        id="company"
                                        value={newContact.company}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContact({ ...newContact, company: e.target.value })}
                                        className="h-9"
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
                                <Button onClick={handleAddContact} disabled={isAdding}>
                                    {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isAdding ? 'Adding...' : 'Add Contact'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
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
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-first_name">First Name</Label>
                                            <Input
                                                id="edit-first_name"
                                                value={editingContact.first_name || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingContact({ ...editingContact, first_name: e.target.value })}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-last_name">Last Name</Label>
                                            <Input
                                                id="edit-last_name"
                                                value={editingContact.last_name || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingContact({ ...editingContact, last_name: e.target.value })}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-company">Company</Label>
                                        <Input
                                            id="edit-company"
                                            value={editingContact.company || ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingContact({ ...editingContact, company: e.target.value })}
                                            className="h-9"
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
                                <Button onClick={handleUpdateContact} disabled={isUpdating}>
                                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card/60 backdrop-blur-sm p-3.5 rounded-xl border shadow-sm">
                <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search contacts..."
                        className="pl-9 w-full bg-background/50 border-input/60 focus:bg-background h-9"
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        className="h-9 w-full sm:w-[130px] rounded-md border border-input bg-background/50 px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="unsubscribed">Unsubscribed</option>
                        <option value="bounced">Bounced</option>
                    </select>

                    <select
                        className="h-9 w-full sm:w-[130px] rounded-md border border-input bg-background/50 px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                    >
                        <option value="all">All Tags</option>
                        {allCurrentTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto h-9 bg-background/50">
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

            {isLoading ? (
                <TableSkeleton />
            ) : filteredContacts.length === 0 ? (
                <Card className="bg-muted/10 border-dashed">
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Search className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No contacts found</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                                {contacts.length === 0
                                    ? 'Get started by adding your first contact manually or importing from CSV.'
                                    : 'No contacts match your current filters. Try adjusting them.'}
                            </p>
                            {contacts.length === 0 && (
                                <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                                    Add your first contact
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="hidden md:block overflow-hidden rounded-xl border shadow-sm">
                        <div className="overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader className="bg-muted/20">
                                    <TableRow className="hover:bg-transparent">
                                        {allColumns.filter(col => visibleColumns.includes(col.id)).map(col => (
                                            <TableHead key={col.id} className="whitespace-nowrap px-4 py-3 h-11 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                                                {col.label}
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-right pr-6 whitespace-nowrap px-4 py-3 h-11 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence>
                                        {paginatedContacts.map((contact) => (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                key={contact.id}
                                                className="group hover:bg-muted/30 transition-colors border-b last:border-0"
                                            >
                                                {allColumns.filter(col => visibleColumns.includes(col.id)).map(col => (
                                                    <TableCell key={col.id} className="whitespace-nowrap px-4 py-3 text-sm">
                                                        {col.id === 'email' && <div className="font-medium text-foreground">{contact.email}</div>}
                                                        {col.id === 'first_name' && (contact.first_name || '-')}
                                                        {col.id === 'last_name' && (contact.last_name || '-')}
                                                        {col.id === 'company' && (contact.company ? <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>{contact.company}</div> : '-')}
                                                        {col.id === 'tags' && renderTags(contact.tags)}
                                                        {col.id === 'status' && (
                                                            <Badge className="text-[10px] uppercase tracking-wider font-semibold" variant={contact.status === 'active' ? 'default' : 'outline'}>
                                                                {contact.status}
                                                            </Badge>
                                                        )}
                                                        {col.id === 'created_at' && <span className="text-muted-foreground text-xs">{new Date(contact.created_at).toLocaleDateString()}</span>}
                                                        {col.isCustom && (contact.custom_fields?.[col.id] || '-')}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-right pr-4 whitespace-nowrap px-4 py-3">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                            onClick={() => openEditDialog(contact)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                            <span className="sr-only">Edit</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={(e) => confirmDelete(contact.id, e)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Delete</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Desktop Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-2">
                            <div className="text-xs text-muted-foreground mr-auto">
                                Page {currentPage} of {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="h-8"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="h-8"
                            >
                                Next
                            </Button>
                        </div>
                    )}

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
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => confirmDelete(contact.id, e)}
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the contact
                            and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setContactToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Contact
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
