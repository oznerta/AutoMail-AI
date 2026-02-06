import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Helper for Date Math
function addTime(date: Date, value: number, unit: 'minutes' | 'hours' | 'days') {
    const result = new Date(date);
    if (unit === 'minutes') result.setMinutes(result.getMinutes() + value);
    if (unit === 'hours') result.setHours(result.getHours() + value);
    if (unit === 'days') result.setDate(result.getDate() + value);
    return result;
}

export async function GET(request: Request) {
    // 0. Basic Auth Check
    const authHeader = request.headers.get('authorization');
    const username = process.env.CRON_USERNAME;
    const password = process.env.CRON_PASSWORD;

    if (authHeader !== `Basic ${btoa(`${username}:${password}`)}`) {
        return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } });
    }

    // 1. Setup Admin Client
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    try {
        const MAX_DURATION = 45000; // 45 seconds (Safe margin for 60s timeout)
        const BATCH_SIZE = 50;
        const startTime = Date.now();
        let processedCount = 0;
        let hasMore = true;

        console.log(`Starting Cron Job at ${new Date().toISOString()}`);


        // 1.5. Campaign Manager (Explode Scheduled Campaigns)
        const { data: dueCampaigns } = await supabaseAdmin
            .from('automations')
            .select('*')
            .eq('type', 'campaign')
            .eq('status', 'scheduled')
            .lte('scheduled_at', new Date().toISOString())
            .limit(1);

        if (dueCampaigns && dueCampaigns.length > 0) {
            const campaign = dueCampaigns[0];
            console.log(`Exploding Campaign: ${campaign.name} (${campaign.id})`);

            // Fetch Audience
            // TODO: Handle Tags (campaign.segment_config.type === 'tag')
            // For now, assuming ALL
            const { data: contacts, error: contactError } = await supabaseAdmin
                .from('contacts')
                .select('id')
                .eq('status', 'active');

            if (!contactError && contacts) {
                // Bulk Insert Queue Items
                const queueItems = contacts.map(c => ({
                    automation_id: campaign.id,
                    contact_id: c.id,
                    // user_id removed - inferred from automation
                    status: 'pending',
                    execute_at: new Date().toISOString(),
                    payload: { step_index: 0 }
                }));

                const { error: insertError } = await supabaseAdmin
                    .from('automation_queue')
                    .insert(queueItems);

                if (insertError) {
                    console.error("Failed to explode campaign:", insertError);
                } else {
                    // Mark Campaign as Completed (delivered to queue)
                    await supabaseAdmin
                        .from('automations')
                        .update({ status: 'completed' }) // Or 'sending' if we want to track queue progress
                        .eq('id', campaign.id);

                    console.log(`Campaign exploded: ${queueItems.length} jobs created.`);
                }
            }
        }

        while (hasMore) {
            // Check Time Budget
            if (Date.now() - startTime > MAX_DURATION) {
                console.log("Cron time limit reached. Stopping batch.");
                break;
            }

            // 2. Fetch & Claim Due Jobs (Atomic)
            const { data: jobs, error: fetchError } = await supabaseAdmin
                .rpc('claim_automation_jobs', { batch_size: BATCH_SIZE })
                .select(`
                    *,
                    automations (
                        name,
                        workflow_config,
                        email_template,
                        user_id
                    ),
                    contacts (
                        id,
                        email,
                        first_name,
                        last_name,
                        company
                    )
                `);

            if (fetchError) throw fetchError;

            if (!jobs || jobs.length === 0) {
                console.log("No more pending jobs.");
                hasMore = false;
                break;
            }

            console.log(`Processing batch of ${jobs.length} jobs...`);

            // 3. Process Each Job in Batch
            for (const job of jobs) {
                // Check time *inside* the batch to exit early if needed
                if (Date.now() - startTime > MAX_DURATION) {
                    console.log("Time limit hit inside batch. Stopping.");
                    hasMore = false;
                    break;
                }

                try {
                    const automation = job.automations as any;
                    const contact = job.contacts;

                    // Parse Payload & Steps
                    const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload || {};
                    const currentStepIndex = payload.step_index || 0;

                    const steps = automation.workflow_config?.steps || [];

                    // Check if completed
                    if (currentStepIndex >= steps.length) {
                        await supabaseAdmin.from('automation_queue').update({ status: 'completed' }).eq('id', job.id);
                        continue;
                    }

                    const currentStep = steps[currentStepIndex];
                    let nextStepIndex = currentStepIndex;
                    let nextExecuteAt = new Date(); // Default: run next step immediately
                    let shouldContinue = true;

                    // --- EXECUTE STEP ---
                    if (currentStep.type === 'delay') {
                        const { value, unit } = currentStep.config;
                        nextExecuteAt = addTime(new Date(), parseInt(value || '1'), unit || 'days');
                        nextStepIndex++;
                        shouldContinue = false;
                    }
                    if (currentStep.type === 'send_email') {
                        if (contact && (contact as any).email) {
                            // BYOK: Fetch User's Resend Key using relation
                            const automationObj = Array.isArray(automation) ? automation[0] : automation;
                            const userId = automationObj?.user_id;

                            if (!userId) {
                                throw new Error("Could not Resolve User ID from Automation Relation");
                            }

                            const { data: keyData } = await supabaseAdmin
                                .from('vault_keys')
                                .select('encrypted_value')
                                .eq('user_id', userId)
                                .eq('provider', 'resend')
                                .single();

                            if (!keyData) throw new Error("User has no Resend key configured.");

                            // Import decrypt helper dynamically
                            const { decrypt } = await import('@/lib/crypto');
                            const apiKey = await decrypt(keyData.encrypted_value);
                            const userResend = new Resend(apiKey);

                            // Fetch email template from database using step config
                            const templateId = currentStep.config?.templateId;
                            const { data: template, error: templateError } = await supabaseAdmin
                                .from('email_templates')
                                .select('subject, content')
                                .eq('id', templateId)
                                .single();

                            if (templateError || !template) {
                                console.error(`[Cron] Failed to fetch template ${templateId}:`, templateError);
                                throw new Error(`Template fetch failed: ${templateError?.message || 'Template not found'}`);
                            }

                            // Import shared processor
                            const { processEmailContent } = await import('@/utils/email-processor');

                            // Replace Variables
                            const variables: Record<string, string> = {
                                email: (contact as any).email || '',
                                first_name: (contact as any).first_name || '',
                                last_name: (contact as any).last_name || '',
                                company: (contact as any).company || '',
                                // Add more vars as schema expands
                            };

                            const htmlContent = processEmailContent(template.content || "<p>No content</p>", variables);
                            const subjectLine = processEmailContent(template.subject || "Update", variables);

                            // Dynamic Sender Configuration from step config
                            let senderEmail = 'onboarding@resend.dev'; // Fallback
                            const senderId = currentStep.config?.senderId;

                            if (senderId) {
                                const { data: senderData } = await supabaseAdmin
                                    .from('sender_identities')
                                    .select('email, name')
                                    .eq('id', senderId)
                                    .eq('user_id', userId)
                                    .single();

                                if (senderData) {
                                    senderEmail = `${senderData.name} <${senderData.email}>`;
                                }
                            }

                            try {
                                const email = variables.email;
                                const emailResult = await userResend.emails.send({
                                    from: senderEmail,
                                    to: email,
                                    subject: subjectLine,
                                    html: htmlContent
                                });
                                console.log(`[Cron] Email sent to ${email} from ${senderEmail}`, emailResult);
                            } catch (emailError: any) {
                                console.error(`[Cron] Email send failed:`, emailError);
                                throw new Error(`Email send failed: ${emailError.message || 'Unknown error'}`);
                            }
                        }
                        nextStepIndex++;
                    }

                    else if (currentStep.type === 'add_tag') {
                        const tagName = currentStep.config.tag;
                        if (tagName && contact && (contact as any).id) {
                            try {
                                // Finds or Create Tag
                                let tagId;
                                const { data: existingTag } = await supabaseAdmin
                                    .from('tags')
                                    .select('id')
                                    .eq('user_id', automation.user_id)
                                    .eq('name', tagName)
                                    .single();

                                if (existingTag) {
                                    tagId = existingTag.id;
                                } else {
                                    const { data: newTag } = await supabaseAdmin
                                        .from('tags')
                                        .insert({ user_id: automation.user_id, name: tagName })
                                        .select('id')
                                        .single();
                                    if (newTag) tagId = newTag.id;
                                }

                                // Link to Contact
                                if (tagId) {
                                    await supabaseAdmin
                                        .from('contact_tags')
                                        .upsert({
                                            contact_id: (contact as any).id,
                                            tag_id: tagId
                                        }, { onConflict: 'contact_id, tag_id' });
                                    console.log(`[Cron] Added tag '${tagName}' to contact ${(contact as any).email}`);

                                    // RECURSIVE TRIGGER: Tag Added
                                    const { data: tagAutomations } = await supabaseAdmin
                                        .from("automations")
                                        .select("*")
                                        .eq("user_id", automation.user_id)
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
                                                    contact_id: (contact as any).id,
                                                    status: 'pending',
                                                    payload: { step_index: 0, trigger_data: { tag: tagName } }
                                                });
                                            }
                                        }
                                        if (recursiveQueue.length > 0) {
                                            await supabaseAdmin.from("automation_queue").insert(recursiveQueue);
                                            console.log(`[Cron] Chained ${recursiveQueue.length} workflows from tag '${tagName}'`);
                                        }
                                    }
                                }
                            } catch (tagError: any) {
                                console.error(`[Cron] Tag operation failed for '${tagName}':`, tagError);
                                // Don't throw - continue workflow even if tagging fails
                            }
                        }
                        nextStepIndex++;
                    }
                    if (nextStepIndex >= steps.length) {
                        await supabaseAdmin.from('automation_queue').update({
                            status: 'completed',
                            payload: { ...payload, step_index: nextStepIndex }
                        }).eq('id', job.id);
                    } else {
                        await supabaseAdmin.from('automation_queue').update({
                            status: 'pending',
                            execute_at: nextExecuteAt.toISOString(),
                            payload: { ...payload, step_index: nextStepIndex },
                            updated_at: new Date().toISOString()
                        }).eq('id', job.id);
                    }

                    processedCount++;

                } catch (jobError: any) {
                    console.error(`Job ${job.id} Failed:`, jobError);

                    const MAX_RETRIES = 3;
                    const currentRetry = (job.retry_count || 0) + 1;

                    if (currentRetry <= MAX_RETRIES) {
                        // Retry with exponential backoff (1m, 5m, 15m)
                        const delayMinutes = Math.pow(5, currentRetry - 1);
                        const nextRetryAt = addTime(new Date(), delayMinutes, 'minutes');

                        console.log(`Retrying job ${job.id} (Attempt ${currentRetry}/${MAX_RETRIES}) in ${delayMinutes}m`);

                        await supabaseAdmin.from('automation_queue').update({
                            status: 'pending',
                            retry_count: currentRetry,
                            execute_at: nextRetryAt.toISOString(),
                            error_message: `Attempt ${currentRetry}: ${jobError.message}`
                        }).eq('id', job.id);

                    } else {
                        // Final Failure
                        const failedStepIndex = (typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload)?.step_index || 0;
                        console.error(`[Cron] Job ${job.id} permanently failed at step ${failedStepIndex}:`, jobError);

                        await supabaseAdmin
                            .from('automation_queue')
                            .update({
                                status: 'failed',
                                error_message: `Step ${failedStepIndex}: ${jobError.message || 'Unknown error'}`,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', job.id);
                    }
                }
            } // End Batch For Loop
        } // End While Loop

        return NextResponse.json({ success: true, processed: processedCount });

    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
