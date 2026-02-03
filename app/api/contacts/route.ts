import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// GET - List all contacts for the authenticated user
export async function GET() {
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

        // Fetch contacts with related tags AND custom fields
        // contact_tags -> tags(name)
        // contact_field_values -> custom_field_definitions(name), value
        const { data: contacts, error } = await supabase
            .from('contacts')
            .select(`
                *,
                contact_tags(tags(name)),
                contact_field_values(
                    value,
                    custom_field_definitions(name)
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database Error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch contacts' },
                { status: 500 }
            );
        }

        // Transform the result to match the expected frontend format
        const formattedContacts = contacts.map((contact: any) => {
            // 1. Tags: string[]
            const tags = contact.contact_tags
                ? contact.contact_tags.map((ct: any) => ct.tags?.name).filter(Boolean)
                : [];

            // 2. Custom Fields: Record<string, string>
            const customFields: Record<string, string> = {};
            if (contact.contact_field_values) {
                contact.contact_field_values.forEach((cf: any) => {
                    const fieldName = cf.custom_field_definitions?.name;
                    if (fieldName) {
                        customFields[fieldName] = cf.value;
                    }
                });
            }

            return {
                ...contact,
                tags,
                custom_fields: customFields,
                // Cleanup raw relations
                contact_tags: undefined,
                contact_field_values: undefined
            };
        });

        return NextResponse.json({ contacts: formattedContacts });
    } catch (error) {
        console.error('Unexpected Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// POST - Create a new contact
const CreateContactSchema = z.object({
    email: z.string().email('Invalid email address'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    company: z.string().optional(),
    tags: z.array(z.string()).optional(),
    custom_fields: z.record(z.string()).optional(),
    source: z.string().optional(),
});

export async function POST(request: Request) {
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
        const validationResult = CreateContactSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation Error', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const { email, first_name, last_name, company, tags = [], custom_fields = {}, source } = validationResult.data;

        // 1. Insert Contact (Ignore custom_fields JSONB if it exists, we use tables now)
        const { data: contact, error: contactError } = await (supabase
            .from('contacts') as any)
            .insert({
                user_id: user.id,
                email,
                first_name,
                last_name,
                company,
                // custom_fields: custom_fields, // DEPRECATED: Don't save to JSONB column
                source: source || 'manual',
                status: 'active',
            })
            .select()
            .single();

        if (contactError) {
            console.error('Database Error:', contactError);
            return NextResponse.json(
                { error: 'Failed to create contact' },
                { status: 500 }
            );
        }

        // 2. Handle Tags
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                let tagId: string | null = null;
                // Find or Create Tag
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
                        .insert({ contact_id: contact.id, tag_id: tagId });
                }
            }
        }

        // 3. Handle Custom Fields (Normalized)
        const fieldKeys = Object.keys(custom_fields);
        if (fieldKeys.length > 0) {
            for (const key of fieldKeys) {
                const value = custom_fields[key];
                if (!value) continue; // Skip empty strings?

                // Find Definition ID
                // Note: We currently require definitions to exist. 
                // Option: Auto-create definition if missing? 
                // For "Strict" normalization, we usually fail or ignore unknown keys.
                // But for good UX here, let's Auto-Create Definition if it doesn't exist (Dynamic Schema).

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
                    // Auto-create definition regarding user intent to "just add fields"
                    const { data: newDef } = await (supabase
                        .from('custom_field_definitions') as any)
                        .insert({ user_id: user.id, name: key, type: 'text' })
                        .select('id')
                        .single();
                    if (newDef) defId = newDef.id;
                }

                if (defId) {
                    await (supabase
                        .from('contact_field_values') as any)
                        .insert({
                            contact_id: contact.id,
                            field_id: defId,
                            value: value
                        });
                }
            }
        }

        // Return formatted response
        return NextResponse.json({
            contact: {
                ...contact,
                tags,
                custom_fields
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
