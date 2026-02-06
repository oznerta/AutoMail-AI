import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type Contact = {
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

async function fetchContacts() {
    const res = await fetch('/api/contacts');
    if (!res.ok) throw new Error('Failed to fetch contacts');
    const data = await res.json();
    return data.contacts as Contact[];
}

async function addContact(contact: Partial<Contact>) {
    const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
    });
    if (!res.ok) throw new Error('Failed to add contact');
    return res.json();
}

async function updateContact(contact: Partial<Contact> & { id: string }) {
    const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
    });
    if (!res.ok) throw new Error('Failed to update contact');
    return res.json();
}

async function deleteContact(id: string) {
    const res = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete contact');
    return res.json();
}

export function useContacts() {
    const queryClient = useQueryClient();

    const { data: contacts, isLoading, error } = useQuery({
        queryKey: ['contacts'],
        queryFn: fetchContacts,
    });

    const addMutation = useMutation({
        mutationFn: addContact,
        onMutate: async (newContact) => {
            await queryClient.cancelQueries({ queryKey: ['contacts'] });
            const previousContacts = queryClient.getQueryData<Contact[]>(['contacts']);

            // Optimistic update
            const optimisticContact = {
                ...newContact,
                id: 'temp-' + Date.now(),
                created_at: new Date().toISOString(),
                status: 'active',
                tags: newContact.tags || [],
                custom_fields: newContact.custom_fields || {},
            } as Contact;

            queryClient.setQueryData<Contact[]>(['contacts'], (old) => {
                return old ? [optimisticContact, ...old] : [optimisticContact];
            });

            return { previousContacts };
        },
        onError: (err, newContact, context) => {
            queryClient.setQueryData(['contacts'], context?.previousContacts);
            toast.error("Failed to add contact");
        },
        onSuccess: () => {
            toast.success("Contact added successfully");
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateContact,
        onMutate: async (updatedContact) => {
            await queryClient.cancelQueries({ queryKey: ['contacts'] });
            const previousContacts = queryClient.getQueryData<Contact[]>(['contacts']);

            queryClient.setQueryData<Contact[]>(['contacts'], (old) => {
                return old?.map((c) =>
                    c.id === updatedContact.id ? { ...c, ...updatedContact } : c
                ) || [];
            });

            return { previousContacts };
        },
        onError: (err, newContact, context) => {
            queryClient.setQueryData(['contacts'], context?.previousContacts);
            toast.error("Failed to update contact");
        },
        onSuccess: () => {
            toast.success("Contact updated successfully");
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteContact,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['contacts'] });
            const previousContacts = queryClient.getQueryData<Contact[]>(['contacts']);

            queryClient.setQueryData<Contact[]>(['contacts'], (old) => {
                return old?.filter((c) => c.id !== id) || [];
            });

            return { previousContacts };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(['contacts'], context?.previousContacts);
            toast.error("Failed to delete contact");
        },
        onSuccess: () => {
            toast.success("Contact deleted");
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
    });

    return {
        contacts,
        isLoading,
        error,
        addContact: addMutation.mutate,
        updateContact: updateMutation.mutate,
        deleteContact: deleteMutation.mutate,
        isAdding: addMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
