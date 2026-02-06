import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const CreateDefinitionSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(['text', 'number', 'date']).default('text'),
});

// GET - List all definitions for user
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabase
            .from('custom_field_definitions')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Fetch Definitions Error:', error);
            return NextResponse.json({ error: 'Failed to fetch definitions' }, { status: 500 });
        }

        return NextResponse.json({ definitions: data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create new definition
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const validated = CreateDefinitionSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('custom_field_definitions')
            .insert({
                user_id: user.id,
                name: validated.data.name,
                type: validated.data.type
            } as any)
            .select()
            .single();

        if (error) {
            // Unique constraint violation code
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Field with this name already exists' }, { status: 409 });
            }
            console.error('Create Definition Error:', error);
            return NextResponse.json({ error: 'Failed to create definition' }, { status: 500 });
        }

        return NextResponse.json({ definition: data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Remove definition (Cascade deletes values)
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { error } = await supabase
            .from('custom_field_definitions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Delete Definition Error:', error);
            return NextResponse.json({ error: 'Failed to delete definition' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
