import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/utils/supabase/server";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // 1. Validate Automation ID
    const automationId = params.id;
    if (!automationId) {
        return NextResponse.json({ error: "Automation ID required" }, { status: 400 });
    }

    // 2. Parse Body
    // 2. Parse Body, then Auth Check
    let body;
    try {
        body = await request.json();
    } catch (e) {
        body = {};
    }

    // 3. Authenticate User (Secure Trigger)
    // Triggers via this endpoint are manual (dashboard) and require Auth.
    // For public webhooks, use /api/hooks/[id]?token=...
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient() as any;

    // 4. Verify Automation Exists & Belongs to User
    const { data: automation, error } = await supabaseAdmin
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .eq('user_id', user.id) // Enforce Ownership
        .eq('status', 'active')
        .single();

    if (error || !automation) {
        return NextResponse.json(
            { error: "Automation not found or inactive" },
            { status: 404 }
        );
    }

    // 4. Check Trigger Type
    // The automation must be configured to accept webhooks
    if (automation.trigger_type !== 'webhook_received') {
        return NextResponse.json(
            { error: "Automation is not configured for webhook triggers" },
            { status: 400 }
        );
    }

    // 5. Add to Queue
    // We queue the execution. The 'contact_id' is optional for generic webhooks, 
    // but our queue schema requires it. 
    // TODO: We might need to handle "anonymous" runs or find a contact from the body.
    // For now, let's look for a 'email' or 'contact_id' in body to link it, 
    // otherwise we might need a distinct 'webhook_payload' field in queue if not checking contacts.

    // For MVP: Let's require an 'email' in the body to associate with a contact, 
    // OR create a temp contact. 
    // Actually, generic webhooks might just run logic. 
    // Checking schema: automation_queue has (automation_id, contact_id). contact_id is UUID/NOT NULL?
    // Let's check schema for contact_id nullable.

    // Based on previous `list_tables` output:
    // automation_queue -> contact_id format: uuid, options: [updatable] (doesn't explicitly say nullable in summary, implies required usually unless 'nullable' listed)
    // Actually in `list_tables` output for `automation_queue`:
    // { "name": "contact_id", "options": ["updatable"] } -> Usually implies NOT NULL if "nullable" is missing.
    // Wait, let's assume it IS required for now. Custom webhooks usually relate to a USER in this CRM context.

    const email = body.email;
    let contactId = body.contact_id;

    if (!contactId && email) {
        // Try to find contact
        const { data: contact } = await supabaseAdmin
            .from('contacts')
            .select('id')
            .eq('user_id', automation.user_id)
            .eq('email', email)
            .single();
        if (contact) contactId = contact.id;
    }

    if (!contactId) {
        return NextResponse.json(
            { error: "Payload must contain 'email' (of existing contact) or 'contact_id'" },
            { status: 400 }
        );
    }

    const { error: queueError } = await supabaseAdmin
        .from('automation_queue')
        .insert({
            automation_id: automationId,
            contact_id: contactId,
            status: 'pending',
            payload: body
        });

    if (queueError) {
        return NextResponse.json({ error: "Failed to queue automation" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Automation triggered" });
}
