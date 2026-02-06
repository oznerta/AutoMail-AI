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
    let triggeredWorkflows = 0; // Declare here for wider scope
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
                // tags field removed - using relational table
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
                // tags field removed - using relational table
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

    // --- Relational Tags Logic ---
    if (tags && Array.isArray(tags) && contact) {
        for (const tagName of tags) {
            if (typeof tagName !== 'string') continue;

            // 1. Find or Create Tag
            let tagId;
            const { data: existingTag } = await supabaseAdmin
                .from('tags')
                .select('id')
                .eq('user_id', keyRecord.user_id)
                .eq('name', tagName)
                .single();

            if (existingTag) {
                tagId = existingTag.id;
            } else {
                const { data: newTag, error: createTagError } = await supabaseAdmin
                    .from('tags')
                    .insert({
                        user_id: keyRecord.user_id,
                        name: tagName
                    })
                    .select('id')
                    .single();

                if (!createTagError && newTag) {
                    tagId = newTag.id;
                }
            }

            // 2. Link to Contact & Trigger Automation
            if (tagId) {
                // Check if link already exists to avoid duplicate triggers
                const { data: existingLink } = await supabaseAdmin
                    .from('contact_tags')
                    .select('id')
                    .eq('contact_id', contact.id)
                    .eq('tag_id', tagId)
                    .single();

                if (!existingLink) {
                    // New Tag Link
                    await supabaseAdmin
                        .from('contact_tags')
                        .insert({
                            contact_id: contact.id,
                            tag_id: tagId
                        });

                    console.log(`[Ingest] Tag '${tagName}' added to contact ${contact.id}`);

                    // Trigger "Tag Added" Automations
                    const { data: tagAutomations } = await supabaseAdmin
                        .from("automations")
                        .select("*")
                        .eq("user_id", keyRecord.user_id)
                        .eq("status", "active")
                        .eq("trigger_type", "tag_added");

                    if (tagAutomations && tagAutomations.length > 0) {
                        const queueItems = [];
                        for (const auto of tagAutomations) {
                            // Check if this automation filters for THIS tag
                            // Workflow config: { trigger: { type: 'tag_added', config: { tag: 'TagName' } } }
                            const triggerConfig = (auto.workflow_config as any)?.trigger;
                            const targetTag = triggerConfig?.config?.tag || triggerConfig?.tag_filter || triggerConfig?.tag;

                            // If no tag specified (wildcard? usually enforced in UI) or matches
                            if (!targetTag || targetTag === tagName) {
                                queueItems.push({
                                    automation_id: auto.id,
                                    contact_id: contact.id,
                                    status: 'pending',
                                    payload: {
                                        step_index: 0,
                                        trigger_data: { tag: tagName }
                                    }
                                });
                            }
                        }

                        if (queueItems.length > 0) {
                            await supabaseAdmin.from("automation_queue").insert(queueItems);
                            triggeredWorkflows += queueItems.length;
                            console.log(`[Ingest] Triggered ${queueItems.length} tag_added workflows for tag '${tagName}'`);
                        }
                    }
                }
            }
        }
    }
    // -----------------------------

    // 6. Trigger "Contact Added" Automations (Only if NEW contact)
    // We determine if it was an insert by checking if existingContact was null
    if (!existingContact && contact) {
        const { data: addedAutomations } = await supabaseAdmin
            .from("automations")
            .select("*")
            .eq("user_id", keyRecord.user_id)
            .eq("status", "active")
            .eq("trigger_type", "contact_added");

        if (addedAutomations && addedAutomations.length > 0) {
            const queueItems = [];

            // Reuse Instant Execution Logic (or simplified version)
            for (const auto of addedAutomations) {
                const firstStep = (auto.workflow_config as any)?.steps?.[0];
                const shouldExecuteInstantly = firstStep && (firstStep.type === 'send_email' || firstStep.type === 'add_tag');

                if (shouldExecuteInstantly) {
                    try {
                        console.log(`[Ingest] Instant execution for contact_added automation ${auto.id}`);

                        if (firstStep.type === 'send_email') {
                            const { Resend } = await import('resend');
                            // Get User's API Key
                            const { data: keyData } = await supabaseAdmin
                                .from('vault_keys')
                                .select('encrypted_value')
                                .eq('user_id', keyRecord.user_id)
                                .eq('provider', 'resend')
                                .single();

                            if (keyData) {
                                const { decrypt } = await import('@/lib/crypto');
                                const apiKey = await decrypt(keyData.encrypted_value);
                                const userResend = new Resend(apiKey);

                                const templateId = firstStep.config?.templateId;
                                const { data: template } = await supabaseAdmin
                                    .from('email_templates')
                                    .select('subject, content')
                                    .eq('id', templateId)
                                    .single();

                                if (template) {
                                    // Simple substitution
                                    let htmlContent = String(template.content || "");
                                    let subjectLine = String(template.subject || "Update");

                                    const { processEmailContent } = await import('@/utils/email-processor');
                                    const variables = {
                                        first_name: contact.first_name,
                                        last_name: contact.last_name,
                                        email: contact.email,
                                        company: contact.company,
                                        ...custom_fields
                                    };
                                    htmlContent = processEmailContent(htmlContent, variables);

                                    subjectLine = subjectLine
                                        .replace(/{{first_name}}/g, contact.first_name || '')
                                        .replace(/{{last_name}}/g, contact.last_name || '');

                                    let senderEmail = 'onboarding@resend.dev';
                                    if (firstStep.config?.senderId) {
                                        const { data: senderData } = await supabaseAdmin
                                            .from('sender_identities')
                                            .select('email, name')
                                            .eq('id', firstStep.config.senderId)
                                            .eq('user_id', keyRecord.user_id)
                                            .single();
                                        if (senderData) senderEmail = `${senderData.name} <${senderData.email}>`;
                                    }

                                    await userResend.emails.send({
                                        from: senderEmail,
                                        to: contact.email,
                                        subject: subjectLine,
                                        html: htmlContent
                                    });
                                }
                            }
                        } else if (firstStep.type === 'add_tag') {
                            const tagName = firstStep.config?.tag;
                            if (tagName) {
                                let tagId;
                                const { data: existingTag } = await supabaseAdmin
                                    .from('tags')
                                    .select('id')
                                    .eq('user_id', keyRecord.user_id)
                                    .eq('name', tagName)
                                    .single();
                                if (existingTag) tagId = existingTag.id;
                                else {
                                    const { data: newTag } = await supabaseAdmin
                                        .from('tags')
                                        .insert({ user_id: keyRecord.user_id, name: tagName })
                                        .select('id').single();
                                    if (newTag) tagId = newTag.id;
                                }
                                if (tagId) {
                                    await supabaseAdmin
                                        .from('contact_tags')
                                        .upsert({ contact_id: contact.id, tag_id: tagId }, { onConflict: 'contact_id, tag_id' });
                                }
                            }
                        }

                        // Queue subsequent steps
                        if ((auto.workflow_config as any)?.steps?.length > 1) {
                            queueItems.push({
                                automation_id: auto.id,
                                contact_id: contact.id,
                                status: 'pending',
                                payload: { step_index: 1 }
                            });
                        }
                    } catch (e) {
                        console.error(`[Ingest] Instant contact_added execution failed`, e);
                        queueItems.push({
                            automation_id: auto.id,
                            contact_id: contact.id,
                            status: 'pending',
                            payload: { step_index: 0 }
                        });
                    }
                } else {
                    queueItems.push({
                        automation_id: auto.id,
                        contact_id: contact.id,
                        status: 'pending',
                        payload: { step_index: 0 }
                    });
                }
            }

            if (queueItems.length > 0) {
                await supabaseAdmin.from("automation_queue").insert(queueItems);
                triggeredWorkflows += queueItems.length; // Count these too
            }
        }
    }

    const eventName = body.event;

    // 5. Trigger Automations (If event is present)
    // let triggeredWorkflows = 0; // Moved to top scope

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
                    // Check if first step should execute instantly
                    // send_email and add_tag steps have no delay, delay steps have config.value
                    const firstStep = (auto.workflow_config as any)?.steps?.[0];
                    const shouldExecuteInstantly = firstStep && (firstStep.type === 'send_email' || firstStep.type === 'add_tag');

                    if (shouldExecuteInstantly) {
                        // Execute first step immediately
                        console.log(`[Ingest] Instant execution for automation ${auto.id}, step type: ${firstStep.type}`);

                        try {
                            if (firstStep.type === 'send_email') {
                                // Import Resend for email sending
                                const { Resend } = await import('resend');

                                // Fetch user's Resend key
                                const { data: keyData } = await supabaseAdmin
                                    .from('vault_keys')
                                    .select('encrypted_value')
                                    .eq('user_id', keyRecord.user_id)
                                    .eq('provider', 'resend')
                                    .single();

                                if (keyData) {
                                    const { decrypt } = await import('@/lib/crypto');
                                    const apiKey = await decrypt(keyData.encrypted_value);
                                    const userResend = new Resend(apiKey);

                                    // Get email template
                                    const templateId = firstStep.config?.templateId;
                                    const { data: template, error: templateError } = await supabaseAdmin
                                        .from('email_templates')
                                        .select('subject, content')
                                        .eq('id', templateId)
                                        .single();

                                    if (templateError) {
                                        console.error(`[Ingest] Failed to fetch template ${templateId}:`, templateError);
                                        throw new Error(`Template fetch failed: ${templateError.message}`);
                                    }

                                    if (template) {
                                        // Replace variables
                                        let htmlContent = String(template.content || "<p>No content</p>");
                                        let subjectLine = String(template.subject || "Update");

                                        const firstName = contact.first_name || '';
                                        const lastName = contact.last_name || '';
                                        const emailAddr = contact.email || '';

                                        htmlContent = htmlContent
                                            .replace(/{{first_name}}/g, firstName)
                                            .replace(/{{last_name}}/g, lastName)
                                            .replace(/{{email}}/g, emailAddr);

                                        subjectLine = subjectLine.replace(/{{first_name}}/g, firstName);

                                        // Get sender
                                        let senderEmail = 'onboarding@resend.dev';
                                        const senderId = firstStep.config?.senderId;

                                        if (senderId) {
                                            const { data: senderData } = await supabaseAdmin
                                                .from('sender_identities')
                                                .select('email, name')
                                                .eq('id', senderId)
                                                .eq('user_id', keyRecord.user_id)
                                                .single();

                                            if (senderData) {
                                                senderEmail = `${senderData.name} <${senderData.email}>`;
                                            }
                                        }

                                        const emailResult = await userResend.emails.send({
                                            from: senderEmail,
                                            to: emailAddr,
                                            subject: subjectLine,
                                            html: htmlContent
                                        });

                                        console.log(`[Ingest] Instant email sent to ${emailAddr} from ${senderEmail}`, emailResult);
                                    }
                                }
                            } else if (firstStep.type === 'add_tag') {
                                // Execute tag addition instantly
                                const tagName = firstStep.config?.tag;
                                if (tagName && contact && (contact as any).id) {
                                    let tagId;
                                    const { data: existingTag } = await supabaseAdmin
                                        .from('tags')
                                        .select('id')
                                        .eq('user_id', keyRecord.user_id)
                                        .eq('name', tagName)
                                        .single();

                                    if (existingTag) {
                                        tagId = existingTag.id;
                                    } else {
                                        const { data: newTag } = await supabaseAdmin
                                            .from('tags')
                                            .insert({ user_id: keyRecord.user_id, name: tagName })
                                            .select('id')
                                            .single();
                                        if (newTag) tagId = newTag.id;
                                    }

                                    if (tagId) {
                                        await supabaseAdmin
                                            .from('contact_tags')
                                            .upsert({
                                                contact_id: (contact as any).id,
                                                tag_id: tagId
                                            }, { onConflict: 'contact_id, tag_id' });
                                        console.log(`[Ingest] Instant tag '${tagName}' added to contact ${(contact as any).email}`);

                                        // RECURSIVE TRIGGER: Tag Added
                                        const { data: tagAutomations } = await supabaseAdmin
                                            .from("automations")
                                            .select("*")
                                            .eq("user_id", keyRecord.user_id)
                                            .eq("status", "active")
                                            .eq("trigger_type", "tag_added");

                                        if (tagAutomations && tagAutomations.length > 0) {
                                            const recursiveQueue = [];
                                            for (const auto of tagAutomations) {
                                                const triggerConfig = (auto.workflow_config as any)?.trigger;
                                                const targetTag = triggerConfig?.config?.tag || triggerConfig?.tag_filter || triggerConfig?.tag;
                                                if (!targetTag || targetTag === tagName) {
                                                    recursiveQueue.push({
                                                        automation_id: auto.id,
                                                        contact_id: contact.id,
                                                        status: 'pending',
                                                        payload: { step_index: 0, trigger_data: { tag: tagName } }
                                                    });
                                                }
                                            }
                                            if (recursiveQueue.length > 0) {
                                                await supabaseAdmin.from("automation_queue").insert(recursiveQueue);
                                                console.log(`[Ingest] Chained ${recursiveQueue.length} workflows from instant tag '${tagName}'`);
                                            }
                                        }
                                    }
                                }
                            }

                            // Queue remaining steps (starting from step 1)
                            if ((auto.workflow_config as any)?.steps?.length > 1) {
                                queueItems.push({
                                    automation_id: auto.id,
                                    contact_id: contact.id,
                                    status: 'pending',
                                    payload: {
                                        step_index: 1, // Start from step 1
                                        event_data: body
                                    }
                                });
                            }
                        } catch (instantError: any) {
                            console.error(`[Ingest] Instant execution failed for automation ${auto.id}:`, {
                                error: instantError.message,
                                stack: instantError.stack,
                                stepType: firstStep?.type
                            });
                            // Fallback: queue entire workflow
                            queueItems.push({
                                automation_id: auto.id,
                                contact_id: contact.id,
                                status: 'pending',
                                payload: {
                                    step_index: 0,
                                    event_data: body
                                }
                            });
                        }
                    } else {
                        // Queue entire workflow for cron
                        queueItems.push({
                            automation_id: auto.id,
                            contact_id: contact.id,
                            status: 'pending',
                            payload: {
                                step_index: 0,
                                event_data: body
                            }
                        });
                    }
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
