import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Service Role Client (Bypasses RLS)
// We need this because the webhook comes from an external source (no user session)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 401 });
        }

        // 1. Verify Automation & Token
        const { data: automation, error: authError } = await supabaseAdmin
            .from('automations')
            .select('id, user_id, status')
            .eq('id', params.id)
            .eq('webhook_token', token)
            .single();

        if (authError || !automation) {
            return NextResponse.json({ error: 'Invalid token or automation not found' }, { status: 401 });
        }

        if (automation.status !== 'active') {
            return NextResponse.json({ error: 'Automation is not active' }, { status: 400 });
        }

        // 2. Parse Body
        const body = await request.json();
        const { email, first_name, last_name, tags } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 3. Upsert Contact (Ensure it belongs to the automation owner)
        // Check if contact exists
        const { data: existingContact } = await supabaseAdmin
            .from('contacts')
            .select('id')
            .eq('email', email)
            .eq('user_id', automation.user_id)
            .single();

        let contactId = existingContact?.id;

        if (contactId) {
            // Update
            await supabaseAdmin
                .from('contacts')
                .update({
                    first_name: first_name || undefined,
                    last_name: last_name || undefined,
                    updated_at: new Date().toISOString()
                })
                .eq('id', contactId);
        } else {
            // Insert
            const { data: newContact, error: createError } = await supabaseAdmin
                .from('contacts')
                .insert({
                    user_id: automation.user_id,
                    email,
                    first_name,
                    last_name,
                    // Default values
                    status: 'active'
                })
                .select()
                .single();

            if (createError) {
                console.error("Contact Creation Error:", createError);
                return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
            }
            contactId = newContact.id;
        }

        // 4. Queue the Automation
        const { error: queueError } = await supabaseAdmin
            .from('automation_queue')
            .insert({
                automation_id: automation.id,
                contact_id: contactId,
                status: 'pending',
                execute_at: new Date().toISOString(), // Execute immediately
                payload: body // Store original payload for reference
            });

        if (queueError) {
            console.error("Queue Error:", queueError);
            return NextResponse.json({ error: 'Failed to queue automation' }, { status: 500 });
        }

        return NextResponse.json({ success: true, contact_id: contactId });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
