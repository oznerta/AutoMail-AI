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

    // 4. Update usage stats (async, don't block response)
    await supabaseAdmin
        .from("webhook_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", keyRecord.id);

    return NextResponse.json({ success: true, contact: result.data });
}
