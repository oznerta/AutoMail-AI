import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { hashApiKey } from "@/lib/api-keys";

export async function POST(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get("key");

    if (!apiKey) {
        return NextResponse.json(
            { error: "Missing API key" },
            { status: 401 }
        );
    }

    const keyHash = hashApiKey(apiKey);
    const supabaseAdmin = createAdminClient() as any;

    // 1. Validate Key & Get User
    const { data: keyRecord, error: keyError } = await supabaseAdmin
        .from("webhook_keys")
        .select("id, user_id")
        .eq("key_hash", keyHash)
        .eq("is_active", true)
        .single();

    if (keyError || !keyRecord) {
        return NextResponse.json(
            { error: "Invalid or inactive API key" },
            { status: 401 }
        );
    }

    // 2. Parse Body
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }

    const { email, first_name, last_name, company, tags, ...custom_fields } = body;

    if (!email) {
        return NextResponse.json(
            { error: "Email is required" },
            { status: 400 }
        );
    }

    // 3. Create/Update Contact
    // We use upsert on email per user? Or just insert?
    // Let's assume Insert for now, or Upsert if we want to update.
    // Ideally Upsert on (user_id, email).
    // Note: contacts table has (id PK). It might verify uniqueness on email per user?
    // Let's check schema/constraints. If unique constraint exists, Upsert works.
    // If not, Insert might duplicate.
    // Let's safe bet: Insert. If error, return error.

    // Check if contact exists
    const { data: existingContact } = await supabaseAdmin
        .from("contacts")
        .select("id")
        .eq("user_id", keyRecord.user_id)
        .eq("email", email)
        .single();

    let result;
    if (existingContact) {
        // Update
        result = await supabaseAdmin
            .from("contacts")
            .update({
                first_name,
                last_name,
                company,
                tags, // Append tags? Replace? Let's just update if provided.
                custom_fields,
                updated_at: new Date().toISOString(),
            })
            .eq("id", existingContact.id)
            .select()
            .single();
    } else {
        // Insert
        result = await supabaseAdmin
            .from("contacts")
            .insert({
                user_id: keyRecord.user_id,
                email,
                first_name,
                last_name,
                company,
                tags: tags || [],
                custom_fields: custom_fields || {},
                status: 'active',
                source: 'api_webhook',
            })
            .select()
            .single();
    }

    if (result.error) {
        return NextResponse.json(
            { error: "Failed to save contact", details: result.error.message },
            { status: 500 }
        );
    }

    // 4. Update usage stats (async)
    supabaseAdmin
        .from("webhook_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", keyRecord.id)
        .then(() => { });

    const contact = result.data;
    const eventName = body.event;

    // 5. Trigger Automations (If event is present)
    let triggeredWorkflows = 0;

    if (eventName && contact) {
        // Fetch active event-based automations for this user
        // We fetch all 'event' triggers for this user and filter in memory to avoid complex JSONB syntax errors
        const { data: automations } = await supabaseAdmin
            .from("automations")
            .select("*")
            .eq("user_id", keyRecord.user_id)
            .eq("status", "active")
            .eq("trigger_type", "event");

        if (automations && automations.length > 0) {
            const queueItems = [];

            for (const auto of automations) {
                // Check if the event matches (assuming workflow_config.trigger.value holds the event name)
                // Fallback: check if the automation name implies it (loose matching for MVP if config structure varies)
                // Ideally: auto.workflow_config?.trigger?.value === eventName

                const triggerConfig = (auto.workflow_config as any)?.trigger;
                // Handle different config structures:
                // 1. { trigger: { type: 'event', config: { event: 'name' } } } (New Page.tsx)
                // 2. { trigger: { event: 'name' } } (Legacy/Other)

                const targetEvent = triggerConfig?.config?.event || triggerConfig?.value || triggerConfig?.event;

                if (targetEvent === eventName) {
                    queueItems.push({
                        automation_id: auto.id,
                        contact_id: contact.id,
                        user_id: keyRecord.user_id,
                        status: 'pending',
                        execute_at: new Date().toISOString(),
                        payload: {
                            step_index: 0,
                            event_data: body // Pass full payload to workflow
                        }
                    });
                }
            }

            if (queueItems.length > 0) {
                const { error: queueError } = await supabaseAdmin
                    .from("automation_queue")
                    .insert(queueItems);

                if (!queueError) {
                    triggeredWorkflows = queueItems.length;
                    console.log(`[Ingest] Triggered ${triggeredWorkflows} workflows for event '${eventName}'`);
                } else {
                    console.error("[Ingest] Failed to queue automations:", queueError);
                }
            }
        }
    }

    return NextResponse.json({
        success: true,
        contact: contact,
        triggered: triggeredWorkflows
    });
}
