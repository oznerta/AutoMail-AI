import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// PATCH - Update a contact
const UpdateContactSchema = z.object({
    email: z.string().email().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    company: z.string().optional(),
    tags: z.array(z.string()).optional(),
    custom_fields: z.record(z.string()).optional(),
    status: z.enum(['active', 'unsubscribed', 'bounced']).optional(),
});

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validationResult = UpdateContactSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation Error', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const { tags, custom_fields, ...contactUpdates } = validationResult.data;

        // 1. Update Contact Scalars
        const { data: contact, error } = await (supabase
            .from('contacts') as any)
            .update(contactUpdates)
            .eq('id', params.id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Database Error:', error);
            return NextResponse.json(
                { error: 'Failed to update contact' },
                { status: 500 }
            );
        }

        // 2. Sync Tags
        if (tags !== undefined) {
            await (supabase.from('contact_tags') as any)
                .delete()
                .eq('contact_id', params.id);

            for (const tagName of tags) {
                let tagId: string | null = null;
                const { data: existingTag } = await (supabase
                    .from('tags') as any)
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('name', tagName)
                    .single();

                if (existingTag) {
                    tagId = existingTag.id;
                } else {
                    const { data: newTag } = await (supabase
                        .from('tags') as any)
                        .insert({ user_id: user.id, name: tagName })
                        .select('id')
                        .single();
                    if (newTag) tagId = newTag.id;
                }

                if (tagId) {
                    await (supabase
                        .from('contact_tags') as any)
                        .insert({ contact_id: params.id, tag_id: tagId });
                }
            }
        }

        // 3. Sync Custom Fields
        if (custom_fields !== undefined) {
            // Strategy: Upsert provided values.
            // If we wanted to "replace all", we would delete first. 
            // Here, we just update/add the keys provided.

            for (const [key, value] of Object.entries(custom_fields)) {
                // Find/Create Definition
                let defId: string | null = null;
                const { data: existingDef } = await (supabase
                    .from('custom_field_definitions') as any)
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('name', key)
                    .single();

                if (existingDef) {
                    defId = existingDef.id;
                } else {
                    const { data: newDef } = await (supabase
                        .from('custom_field_definitions') as any)
                        .insert({ user_id: user.id, name: key, type: 'text' })
                        .select('id')
                        .single();
                    if (newDef) defId = newDef.id;
                }

                if (defId) {
                    // Delete old value if exists to simulate clean upsert or just use upsert syntax
                    // Supabase upsert requires primary key constraint match
                    // PK is (contact_id, field_id)

                    await (supabase
                        .from('contact_field_values') as any)
                        .upsert({
                            contact_id: params.id,
                            field_id: defId,
                            value: value
                        }, { onConflict: 'contact_id, field_id' });
                }
            }
        }

        return NextResponse.json({
            contact: {
                ...contact,
                tags: tags || [], // Optimistic
                custom_fields: custom_fields || {} // Optimistic
            }
        });
    } catch (error) {
        console.error('Unexpected Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a contact
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', params.id)
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json(
                { error: 'Failed to delete contact' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
