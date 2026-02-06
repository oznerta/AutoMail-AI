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
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: contactId } = await params;
    try {
        const supabase = await createClient();

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
            .eq('id', contactId)
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
            // Get existing tags to determine what's NEW
            const { data: existingTagLinks } = await (supabase
                .from('contact_tags') as any)
                .select('tag_id, tags!inner(name)')
                .eq('contact_id', contactId);

            const existingTagNames = new Set((existingTagLinks || []).map((link: any) => link.tags.name));
            const newTagsSet = new Set(tags);
            const addedTags = tags.filter(tag => !existingTagNames.has(tag));

            await (supabase.from('contact_tags') as any)
                .delete()
                .eq('contact_id', contactId);

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
                        .insert({ contact_id: contactId, tag_id: tagId });
                }
            }

            // Trigger "Tag Added" Automations for newly added tags
            if (addedTags.length > 0) {
                const { data: tagAutomations } = await supabase
                    .from("automations")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("status", "active")
                    .eq("trigger_type", "tag_added");

                const activeAutomations = (tagAutomations || []) as any[];

                if (activeAutomations.length > 0) {
                    const queueItems = [];
                    for (const tagName of addedTags) {
                        for (const auto of activeAutomations) {
                            const triggerConfig = (auto.workflow_config as any)?.trigger;
                            const targetTag = triggerConfig?.config?.tag || triggerConfig?.tag_filter || triggerConfig?.tag;

                            if (!targetTag || targetTag === tagName) {
                                queueItems.push({
                                    automation_id: auto.id,
                                    contact_id: contactId,
                                    status: 'pending',
                                    payload: {
                                        step_index: 0,
                                        trigger_data: { tag: tagName }
                                    }
                                });
                            }
                        }
                    }

                    if (queueItems.length > 0) {
                        await (supabase.from("automation_queue") as any).insert(queueItems);
                        console.log(`[Manual Update] Triggered ${queueItems.length} workflows for tags: ${addedTags.join(', ')}`);
                    }
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
                            contact_id: contactId,
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
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: contactId } = await params;
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', contactId)
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
