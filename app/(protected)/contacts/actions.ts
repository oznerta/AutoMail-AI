'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ContactSchema = z.object({
    email: z.string().email(),
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    tags: z.union([z.array(z.string()), z.string()]).optional().nullable(),
    custom_fields: z.record(z.any()).optional().nullable(),
});

export type ImportStats = {
    total: number;
    success: number;
    failed: number;
    errors: string[];
};

export async function bulkCreateContacts(contacts: any[]): Promise<ImportStats> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const stats: ImportStats = {
        total: contacts.length,
        success: 0,
        failed: 0,
        errors: []
    };

    if (contacts.length === 0) {
        return stats;
    }

    // Chunk processing
    const CHUNK_SIZE = 50;
    for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
        const chunk = contacts.slice(i, i + CHUNK_SIZE);

        // 1. Validate and prepare clean data
        const cleanRows: Array<{
            user_id: string;
            email: string;
            first_name: string;
            last_name: string;
            company: string;
            phone: string | null;
            tags: string[];
            custom_fields: Record<string, any>;
            status: 'active';
            source: string;
            updated_at: string;
        }> = [];

        for (let idx = 0; idx < chunk.length; idx++) {
            const row = chunk[idx];
            const result = ContactSchema.safeParse(row);
            if (!result.success) {
                stats.failed++;
                stats.errors.push(`Row ${i + idx + 1}: Invalid Data (${result.error.errors[0]?.message || 'Invalid format'})`);
                continue;
            }

            const rawTags = result.data.tags;
            const parsedTags: string[] = Array.isArray(rawTags)
                ? rawTags.map(String).map(t => t.trim()).filter(Boolean)
                : typeof rawTags === 'string'
                    ? rawTags.split(/[,;]/).map(t => t.trim()).filter(Boolean)
                    : [];

            cleanRows.push({
                user_id: user.id,
                email: result.data.email.trim().toLowerCase(),
                first_name: result.data.first_name?.trim() || '',
                last_name: result.data.last_name?.trim() || '',
                company: result.data.company?.trim() || '',
                phone: result.data.phone?.trim() || null,
                tags: parsedTags,
                custom_fields: (row.custom_fields && typeof row.custom_fields === 'object') ? row.custom_fields : {},
                status: 'active',
                source: 'import_csv',
                updated_at: new Date().toISOString()
            });
        }

        if (cleanRows.length === 0) continue;

        try {
            // 2. Fetch existing contacts in this chunk for safe upsert
            const emails = Array.from(new Set(cleanRows.map(r => r.email)));
            const { data: existingContacts, error: queryError } = await supabase
                .from('contacts')
                .select('id, email')
                .eq('user_id', user.id)
                .in('email', emails);

            if (queryError) {
                throw queryError;
            }

            const existingMap = new Map<string, string>(
                (existingContacts || []).map(c => [c.email.toLowerCase(), c.id])
            );

            const insertRows = cleanRows.filter(r => !existingMap.has(r.email));
            const updateRows = cleanRows.filter(r => existingMap.has(r.email));

            const newlyCreatedContacts: Array<{ id: string; email: string }> = [];

            // Execute Inserts
            if (insertRows.length > 0) {
                const { data: inserted, error: insertError } = await supabase
                    .from('contacts')
                    .insert(insertRows)
                    .select('id, email');

                if (insertError) {
                    throw insertError;
                }
                if (inserted) {
                    newlyCreatedContacts.push(...inserted);
                    stats.success += inserted.length;
                }
            }

            // Execute Updates
            for (const upd of updateRows) {
                const contactId = existingMap.get(upd.email);
                if (contactId) {
                    const { error: updateError } = await supabase
                        .from('contacts')
                        .update({
                            first_name: upd.first_name,
                            last_name: upd.last_name,
                            company: upd.company,
                            phone: upd.phone,
                            tags: upd.tags,
                            custom_fields: upd.custom_fields,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', contactId)
                        .eq('user_id', user.id);

                    if (updateError) {
                        stats.failed++;
                        stats.errors.push(`Failed to update ${upd.email}: ${updateError.message}`);
                    } else {
                        stats.success++;
                    }
                }
            }

            // 3. Trigger "Contact Added" Automations only for newly inserted contacts
            if (newlyCreatedContacts.length > 0) {
                const { data: automations } = await supabase
                    .from("automations")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("status", "active")
                    .eq("trigger_type", "contact_added");

                if (automations && automations.length > 0) {
                    const queueItems = [];
                    for (const contact of newlyCreatedContacts) {
                        for (const auto of automations) {
                            queueItems.push({
                                automation_id: auto.id,
                                contact_id: contact.id,
                                status: 'pending' as const,
                                payload: { step_index: 0 }
                            });
                        }
                    }

                    if (queueItems.length > 0) {
                        await supabase.from('automation_queue').insert(queueItems);
                    }
                }
            }
        } catch (batchError: any) {
            console.error("Bulk Import Batch Error:", batchError);
            stats.failed += cleanRows.length;
            stats.errors.push(`Batch error: ${batchError.message || 'Unknown database error'}`);
        }
    }

    revalidatePath('/contacts');
    return stats;
}
