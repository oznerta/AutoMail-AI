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
    const supabase = createClient();
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

        if (cleanRows.length === 0) continue;

        // 2. Bulk Upsert
        // We assume email is unique-ish. If user has duplicate emails in CSV, last one wins in this batch.
        // On conflict: update the fields.
        const { error } = await (supabase
            .from('contacts') as any)
            .upsert(cleanRows, {
                onConflict: 'email', // Assuming there's a unique constraint on email? Or (user_id, email)?
                // RLS forces user_id check implicitly, but for onConflict to work, we need the DB constraint.
                // If no constraint, this might fail or duplicate.
                ignoreDuplicates: false
            });

        if (error) {
            console.error("Bulk Import Error:", error);
            stats.failed += cleanRows.length;
            stats.errors.push(`Batch Error: ${error.message}`);
        } else {
            stats.success += cleanRows.length;
        }
    }

    revalidatePath('/contacts');
    return stats;
}
