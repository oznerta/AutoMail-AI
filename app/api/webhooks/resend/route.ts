import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import crypto from "crypto";

/**
 * Verifies the Svix / Resend webhook signature using HMAC-SHA256.
 * Resend sends headers: svix-id, svix-timestamp, svix-signature.
 */
function verifySvixSignature(rawBody: string, headers: Headers, secret: string): boolean {
    const svixId = headers.get("svix-id");
    const svixTimestamp = headers.get("svix-timestamp");
    const svixSignature = headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
        return false;
    }

    // Guard against replay attacks (allow 5-minute clock drift)
    const timestampSec = parseInt(svixTimestamp, 10);
    const nowSec = Math.floor(Date.now() / 1000);
    if (isNaN(timestampSec) || Math.abs(nowSec - timestampSec) > 300) {
        return false;
    }

    try {
        const cleanSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
        const secretBuffer = Buffer.from(cleanSecret, "base64");
        const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
        const expectedSignature = crypto
            .createHmac("sha256", secretBuffer)
            .update(signedPayload)
            .digest("base64");

        const signatures = svixSignature.split(" ");
        for (const sig of signatures) {
            const [version, signature] = sig.split(",");
            if (version === "v1" && signature === expectedSignature) {
                return true;
            }
        }
    } catch (err) {
        console.error("[Resend Webhook] Signature verification error:", err);
        return false;
    }

    return false;
}

/**
 * Normalizes tags from Resend webhook payload whether sent as array or object.
 */
function extractTags(rawTags: any): Record<string, string> {
    const tags: Record<string, string> = {};
    if (!rawTags) return tags;

    if (Array.isArray(rawTags)) {
        for (const item of rawTags) {
            if (item && typeof item === "object" && item.name && item.value) {
                tags[item.name] = String(item.value);
            }
        }
    } else if (typeof rawTags === "object") {
        for (const [k, v] of Object.entries(rawTags)) {
            if (v !== undefined && v !== null) {
                tags[k] = String(v);
            }
        }
    }

    return tags;
}

export async function GET() {
    return NextResponse.json({
        status: "active",
        service: "AutoMail AI Resend Webhook Listener",
        timestamp: new Date().toISOString()
    });
}

export async function POST(request: NextRequest) {
    let rawBody: string;
    try {
        rawBody = await request.text();
    } catch {
        return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
    }

    const secret = process.env.RESEND_WEBHOOK_SECRET;

    if (secret) {
        const isValid = verifySvixSignature(rawBody, request.headers, secret);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
        }
    } else {
        // Log in development/staging when secret is not yet configured
        console.warn("[Resend Webhook] RESEND_WEBHOOK_SECRET not set; proceeding without signature verification.");
    }

    let payload: any;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const eventType = payload?.type;
    const data = payload?.data;

    if (!eventType || !data) {
        return NextResponse.json({ error: "Missing event type or data" }, { status: 400 });
    }

    const tags = extractTags(data.tags);
    const headers = data.headers || {};

    const automationId = tags.automation_id || tags.automationId || headers["x-automation-id"] || headers["X-Automation-Id"];
    const contactId = tags.contact_id || tags.contactId || headers["x-contact-id"] || headers["X-Contact-Id"];
    const userId = tags.user_id || tags.userId;
    const recipientEmail = Array.isArray(data.to) ? data.to[0] : data.to;

    const supabaseAdmin = createAdminClient() as any;
    let automationUpdated = false;
    let contactUpdated = false;

    try {
        // 1. Update Automation Statistics
        if (automationId) {
            const { data: auto } = await supabaseAdmin
                .from("automations")
                .select("id, total_sent, total_opened, total_clicked, total_bounced")
                .eq("id", automationId)
                .single();

            if (auto) {
                const statUpdates: Record<string, any> = {
                    updated_at: new Date().toISOString()
                };

                if (eventType === "email.delivered" || eventType === "email.sent") {
                    statUpdates.total_sent = (auto.total_sent || 0) + 1;
                } else if (eventType === "email.opened") {
                    statUpdates.total_opened = (auto.total_opened || 0) + 1;
                } else if (eventType === "email.clicked") {
                    statUpdates.total_clicked = (auto.total_clicked || 0) + 1;
                } else if (eventType === "email.bounced") {
                    statUpdates.total_bounced = (auto.total_bounced || 0) + 1;
                }

                if (Object.keys(statUpdates).length > 1) {
                    const { error: autoError } = await supabaseAdmin
                        .from("automations")
                        .update(statUpdates)
                        .eq("id", automationId);

                    if (!autoError) {
                        automationUpdated = true;
                    } else {
                        console.error("[Resend Webhook] Failed to update automation stats:", autoError);
                    }
                }
            }
        }

        // 2. Update Contact Status & Engagement
        const contactUpdates: Record<string, any> = {
            updated_at: new Date().toISOString()
        };

        if (eventType === "email.bounced") {
            contactUpdates.status = "bounced";
        } else if (eventType === "email.complained") {
            contactUpdates.status = "unsubscribed";
        } else if (eventType === "email.delivered") {
            contactUpdates.last_contacted_at = new Date().toISOString();
        }

        if (Object.keys(contactUpdates).length > 1) {
            if (contactId) {
                const { error: contactError } = await supabaseAdmin
                    .from("contacts")
                    .update(contactUpdates)
                    .eq("id", contactId);

                if (!contactError) contactUpdated = true;
            } else if (recipientEmail) {
                let query = supabaseAdmin
                    .from("contacts")
                    .update(contactUpdates)
                    .eq("email", recipientEmail);

                if (userId) {
                    query = query.eq("user_id", userId);
                }

                const { error: contactError } = await query;
                if (!contactError) contactUpdated = true;
            }
        }

        return NextResponse.json({
            received: true,
            event: eventType,
            updated: {
                automation: automationUpdated,
                contact: contactUpdated
            }
        });
    } catch (err: any) {
        console.error("[Resend Webhook] Processing error:", err);
        return NextResponse.json(
            { error: "Internal error processing webhook event", details: err?.message },
            { status: 500 }
        );
    }
}
