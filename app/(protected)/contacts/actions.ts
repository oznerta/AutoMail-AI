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
    // We can add tags support later
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

    // Chuuk processing
    const CHUNK_SIZE = 50;
    for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
        const chunk = contacts.slice(i, i + CHUNK_SIZE);

        // 1. Prepare Data
        const cleanRows = [];

        for (const row of chunk) {
            const result = ContactSchema.safeParse(row);
            if (!result.success) {
                stats.failed++;
                stats.errors.push(`Row ${i + stats.failed + stats.success}: Invalid Data (${result.error.errors[0].message})`);
                continue;
            }

            cleanRows.push({
                user_id: user.id,
                email: result.data.email,
                first_name: result.data.first_name || '',
                last_name: result.data.last_name || '',
                company: result.data.company || '',
                status: 'active',
                source: 'import_csv',
                updated_at: new Date().toISOString()
            });
        }



        // 2. Bulk Upsert
        const { data: upsertedContacts, error } = await (supabase
            .from('contacts') as any)
            .upsert(cleanRows, {
                onConflict: 'email',
                ignoreDuplicates: false
            })
            .select(); // We MUST select to get IDs for queueing

        if (error) {
            console.error("Bulk Import Error:", error);
            stats.failed += cleanRows.length;
            stats.errors.push(`Batch Error: ${error.message}`);
        } else {
            stats.success += upsertedContacts.length;

            // 3. Trigger "Contact Added" Automations (Queue Only - No Instant to avoid timeout)
            const { data: automations } = await supabase
                .from("automations")
                .select("id") // We only need IDs to queue
                .eq("user_id", user.id)
                .eq("status", "active")
                .eq("trigger_type", "contact_added");

            if (automations && automations.length > 0 && upsertedContacts.length > 0) {
                const queueItems = [];
                // For every contact...
                for (const contact of upsertedContacts) {
                    // For every automation...
                    for (const auto of (automations as { id: string }[])) {
                        queueItems.push({
                            automation_id: auto.id,
                            contact_id: contact.id,
                            status: 'pending',
                            payload: { step_index: 0 } // Always start at 0, let Cron handle it
                        });
                    }
                }

                if (queueItems.length > 0) {
                    await (supabase.from('automation_queue') as any).insert(queueItems);
                }
            }
        }
    }

    revalidatePath('/contacts');
    return stats;
}
