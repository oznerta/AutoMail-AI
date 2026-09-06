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
    // 0. Basic Auth Check / Vercel Cron Check
    const authHeader = request.headers.get('authorization');
    const username = process.env.CRON_USERNAME;
    const password = process.env.CRON_PASSWORD;
    const vercelCronSecret = process.env.CRON_SECRET;

    const isBasicAuth = authHeader === `Basic ${btoa(`${username}:${password}`)}`;
    const isVercelCron = vercelCronSecret && authHeader === `Bearer ${vercelCronSecret}`;
    const isLocalDev = process.env.NODE_ENV === 'development';

    if (!isBasicAuth && !isVercelCron && !isLocalDev) {
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
            let contactQuery = supabaseAdmin
                .from('contacts')
                .select('id')
                .eq('user_id', campaign.user_id)
                .eq('status', 'active');

            // Handle tag segmentation if configured
            const segmentConfig = campaign.segment_config;
            if (
                segmentConfig &&
                segmentConfig.type === 'tag' &&
                Array.isArray(segmentConfig.value) &&
                segmentConfig.value.length > 0
            ) {
                // Filter contacts that contain any of the selected segment tags
                contactQuery = contactQuery.overlaps('tags', segmentConfig.value);
            }

            const { data: contacts, error: contactError } = await contactQuery;

            if (!contactError && contacts) {
                if (contacts.length === 0) {
                    await supabaseAdmin
                        .from('automations')
                        .update({ status: 'completed', updated_at: new Date().toISOString() })
                        .eq('id', campaign.id);
                    console.log(`[Cron] Campaign ${campaign.name} (${campaign.id}) had 0 contacts. Marked as completed.`);
                } else {
                    // Bulk Insert Queue Items
                    const queueItems = contacts.map(c => ({
                        automation_id: campaign.id,
                        contact_id: c.id,
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
                        // Mark Campaign as Active (delivering via queue)
                        await supabaseAdmin
                            .from('automations')
                            .update({ status: 'active', updated_at: new Date().toISOString() })
                            .eq('id', campaign.id);

                        console.log(`Campaign exploded: ${queueItems.length} jobs created.`);
                    }
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

                    let shouldContinue = true;
                    let nextStepIndex = currentStepIndex;
                    let nextExecuteAt = new Date(); // Default: run next step immediately

                    // --- EXECUTE STEPS LOOP ---
                    // Run multiple instant steps sequentially in the same cron job run
                    while (shouldContinue && nextStepIndex < steps.length) {
                        const currentStep = steps[nextStepIndex];
                        
                        if (currentStep.type === 'delay') {
                            const { value, unit } = currentStep.config;
                            nextExecuteAt = addTime(new Date(), parseInt(value || '1'), unit || 'days');
                            nextStepIndex++;
                            shouldContinue = false; // Stop internal loop, wait for next cron
                        } 
                        else if (currentStep.type === 'send_email') {
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
                                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                                const contactId = (contact as any)?.id || '';
                                const unsubUrl = `${appUrl}/unsubscribe?id=${contactId}&email=${encodeURIComponent((contact as any)?.email || '')}`;

                                const variables: Record<string, string> = {
                                    email: (contact as any).email || '',
                                    first_name: (contact as any).first_name || '',
                                    last_name: (contact as any).last_name || '',
                                    company: (contact as any).company || '',
                                    unsubscribe_url: unsubUrl,
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
                                        html: htmlContent,
                                        headers: {
                                            'X-Automation-Id': automation.id,
                                            'X-Contact-Id': contactId,
                                            'List-Unsubscribe': `<${unsubUrl}>`,
                                            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                                        },
                                        tags: [
                                            { name: 'automation_id', value: automation.id },
                                            { name: 'contact_id', value: contactId },
                                            { name: 'user_id', value: automation.user_id },
                                        ].filter(t => Boolean(t.value))
                                    });
                                    console.log(`[Cron] Email sent to ${email} from ${senderEmail}`, emailResult);
                                } catch (emailError: any) {
                                    console.error(`[Cron] Email send failed:`, emailError);
                                    throw new Error(`Email send failed: ${emailError.message || 'Unknown error'}`);
                                }
                            }
                            nextStepIndex++;
                            // shouldContinue remains true, move to next step instantly
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
                            // shouldContinue remains true, move to next step instantly
                        }
                        else if (currentStep.type === 'condition') {
                            const conditionConfig = currentStep.config || {};
                            const field = conditionConfig.field || 'tag';
                            const operator = conditionConfig.operator || 'has_tag';
                            const targetValue = String(conditionConfig.value || '').trim();

                            let matches = false;

                            if (field === 'tag' || operator === 'has_tag') {
                                const contactTags: string[] = Array.isArray((contact as any)?.tags) ? (contact as any).tags : [];
                                matches = contactTags.some((t: string) => t.toLowerCase() === targetValue.toLowerCase());

                                if (!matches && (contact as any)?.id) {
                                    const { data: tagLink } = await supabaseAdmin
                                        .from('contact_tags')
                                        .select('tag_id, tags!inner(name)')
                                        .eq('contact_id', (contact as any).id)
                                        .eq('tags.name', targetValue)
                                        .maybeSingle();
                                    if (tagLink) matches = true;
                                }
                            } else if (field === 'status') {
                                const contactStatus = String((contact as any)?.status || '');
                                matches = operator === 'not_equals' ? contactStatus !== targetValue : contactStatus === targetValue;
                            } else if (field === 'company') {
                                const company = String((contact as any)?.company || '').toLowerCase();
                                const val = targetValue.toLowerCase();
                                matches = operator === 'contains' ? company.includes(val) : company === val;
                            } else if (field === 'email') {
                                const email = String((contact as any)?.email || '').toLowerCase();
                                const val = targetValue.toLowerCase();
                                matches = operator === 'contains' ? email.includes(val) : email === val;
                            }

                            const branch = matches ? conditionConfig.then_action : conditionConfig.else_action;

                            if (branch && branch.type) {
                                if (branch.type === 'send_email' && branch.template_id) {
                                    const templateId = branch.template_id;
                                    const { data: branchTemplate } = await supabaseAdmin
                                        .from('email_templates')
                                        .select('subject, content')
                                        .eq('id', templateId)
                                        .maybeSingle();

                                    if (branchTemplate && (contact as any)?.email) {
                                        const automationObj = Array.isArray(automation) ? automation[0] : automation;
                                        const userId = automationObj?.user_id;

                                        const { data: keyData } = await supabaseAdmin
                                            .from('vault_keys')
                                            .select('encrypted_value')
                                            .eq('user_id', userId)
                                            .eq('provider', 'resend')
                                            .maybeSingle();

                                        if (keyData) {
                                            const { decrypt } = await import('@/lib/crypto');
                                            const apiKey = await decrypt(keyData.encrypted_value);
                                            const branchResend = new Resend(apiKey);
                                            const { processEmailContent } = await import('@/utils/email-processor');

                                            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                                            const contactId = (contact as any)?.id || '';
                                            const unsubUrl = `${appUrl}/unsubscribe?id=${contactId}&email=${encodeURIComponent((contact as any)?.email || '')}`;

                                            const branchVars: Record<string, string> = {
                                                email: (contact as any).email || '',
                                                first_name: (contact as any).first_name || '',
                                                last_name: (contact as any).last_name || '',
                                                company: (contact as any).company || '',
                                                unsubscribe_url: unsubUrl,
                                            };

                                            const branchHtml = processEmailContent(branchTemplate.content || "<p>No content</p>", branchVars);
                                            const branchSub = processEmailContent(branchTemplate.subject || "Update", branchVars);

                                            let senderEmail = 'onboarding@resend.dev';
                                            if (branch.sender_id) {
                                                const { data: senderData } = await supabaseAdmin
                                                    .from('sender_identities')
                                                    .select('email, name')
                                                    .eq('id', branch.sender_id)
                                                    .eq('user_id', userId)
                                                    .maybeSingle();
                                                if (senderData) senderEmail = `${senderData.name} <${senderData.email}>`;
                                            }

                                            await branchResend.emails.send({
                                                from: senderEmail,
                                                to: (contact as any).email,
                                                subject: branchSub,
                                                html: branchHtml,
                                                headers: {
                                                    'X-Automation-Id': automation.id,
                                                    'X-Contact-Id': contactId,
                                                    'List-Unsubscribe': `<${unsubUrl}>`,
                                                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                                                },
                                                tags: [
                                                    { name: 'automation_id', value: automation.id },
                                                    { name: 'contact_id', value: contactId },
                                                    { name: 'user_id', value: automation.user_id },
                                                ].filter(t => Boolean(t.value))
                                            });
                                            console.log(`[Cron Condition] Sent conditional email (${templateId}) to ${(contact as any).email}`);
                                        }
                                    }
                                } else if (branch.type === 'add_tag' && branch.tag) {
                                    const tagName = branch.tag;
                                    let tagId;
                                    const { data: existingTag } = await supabaseAdmin
                                        .from('tags')
                                        .select('id')
                                        .eq('user_id', automation.user_id)
                                        .eq('name', tagName)
                                        .maybeSingle();

                                    if (existingTag) {
                                        tagId = existingTag.id;
                                    } else {
                                        const { data: newTag } = await supabaseAdmin
                                            .from('tags')
                                            .insert({ user_id: automation.user_id, name: tagName })
                                            .select('id')
                                            .maybeSingle();
                                        if (newTag) tagId = newTag.id;
                                    }

                                    if (tagId && (contact as any)?.id) {
                                        await supabaseAdmin
                                            .from('contact_tags')
                                            .upsert({ contact_id: (contact as any).id, tag_id: tagId }, { onConflict: 'contact_id, tag_id' });
                                        console.log(`[Cron Condition] Added branch tag '${tagName}' to ${(contact as any).email}`);
                                    }
                                }
                            }
                            nextStepIndex++;
                        } else {
                            // Safety catch for unknown steps
                            console.warn(`[Cron] Unknown step type: ${currentStep.type}`);
                            nextStepIndex++;
                        }
                    } // End While shouldContinue

                    if (nextStepIndex >= steps.length) {
                        await supabaseAdmin.from('automation_queue').update({
                            status: 'completed',
                            payload: { ...payload, step_index: nextStepIndex },
                            updated_at: new Date().toISOString()
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

        // Check if any active campaigns have completed all their queue jobs
        const { data: activeCampaigns } = await supabaseAdmin
            .from('automations')
            .select('id')
            .eq('type', 'campaign')
            .eq('status', 'active');

        if (activeCampaigns && activeCampaigns.length > 0) {
            for (const camp of activeCampaigns) {
                const { count, error: queueCheckError } = await supabaseAdmin
                    .from('automation_queue')
                    .select('*', { count: 'exact', head: true })
                    .eq('automation_id', camp.id)
                    .in('status', ['pending', 'processing']);

                if (!queueCheckError && count === 0) {
                    await supabaseAdmin
                        .from('automations')
                        .update({ status: 'completed', updated_at: new Date().toISOString() })
                        .eq('id', camp.id);
                    console.log(`[Cron] Campaign ${camp.id} completed: all queue jobs finished.`);
                }
            }
        }

        return NextResponse.json({ success: true, processed: processedCount });

    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
