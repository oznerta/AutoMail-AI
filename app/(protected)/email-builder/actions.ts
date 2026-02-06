'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { decrypt } from "@/lib/crypto";

// --- Validation Schemas ---

const CreateTemplateSchema = z.object({
    name: z.string().min(1, "Template name is required").max(100, "Name is too long"),
});

const UpdateTemplateSchema = z.object({
    name: z.string().min(1, "Template name is required").optional(),
    subject: z.string().max(200, "Subject is too long").optional(),
    content: z.string().optional(),
});

const GenerateContentSchema = z.object({
    prompt: z.string().min(10, "Prompt must be at least 10 characters").max(1000, "Prompt is too long"),
});

// --- Actions ---

export async function getTemplates() {
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id) // Strict filtering
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching templates:', error);
        return [];
    }

    return data;
}

export type ActionState = {
    success?: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    data?: any;
}

export async function createTemplate(name: string): Promise<ActionState & { id?: string }> {
    const supabase = createClient() as any;

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // 2. Validation
    const validated = CreateTemplateSchema.safeParse({ name });
    if (!validated.success) {
        return {
            error: "Validation Failed",
            fieldErrors: validated.error.flatten().fieldErrors
        };
    }

    // 3. DB Insert
    const { data, error } = await supabase
        .from('email_templates')
        .insert({
            user_id: user.id,
            name: validated.data.name,
            content: '<html><body><p>Start writing your email...</p></body></html>',
            subject: 'New Subject' // Reasonable default
        })
        .select()
        .single();

    if (error) {
        console.error("Create Template Error:", error);
        return { error: "Failed to create template. Please try again." };
    }

    revalidatePath('/email-builder');
    // We return the ID so the client can redirect, or we can redirect here.
    // Redirecting from server action is fine, but handling it in client gives better loading states.
    // For now, let's redirect to be consistent with previous implementation, 
    // BUT typically returning success/id is better for "Quick Create" flows.
    // I'll keep the redirect for the main flow, but we can refactor the client to handle it if needed.
    redirect(`/email-builder/${data.id}`);
}

export async function deleteTemplate(id: string): Promise<ActionState> {
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error, count } = await supabase
        .from('email_templates')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', user.id); // Security: Ensure ownership

    if (error) {
        console.error("Delete Template Error:", error);
        return { error: "Failed to delete template." };
    }

    if (count === 0) {
        return { error: "Template not found or could not be deleted." };
    }

    revalidatePath('/email-builder');
    return { success: true };
}

export async function getTemplate(id: string) {
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id) // Security: Ensure ownership
        .single();

    if (error) return null;
    return data;
}

export async function updateTemplate(id: string, updates: any): Promise<ActionState> {
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Validation
    const validated = UpdateTemplateSchema.safeParse(updates);
    if (!validated.success) {
        return {
            error: "Validation Failed",
            fieldErrors: validated.error.flatten().fieldErrors
        };
    }

    const { error } = await supabase
        .from('email_templates')
        .update({
            ...validated.data,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id); // Security check

    if (error) {
        console.error("Update Template Error:", error);
        return { error: "Failed to save template." };
    }

    revalidatePath(`/email-builder/${id}`);
    revalidatePath('/email-builder');
    return { success: true };
}

const ChatMessageSchema = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string()
});

const CleanedGenerateContentSchema = z.object({
    messages: z.array(ChatMessageSchema),
    model: z.enum(["gpt-5.2", "gpt-5-mini", "o1-preview", "o1-mini", "gpt-4o"]).optional().default("gpt-5.2"),
    currentContent: z.string().optional() // New: Pass current editor state for context
});

export async function generateEmailContent(
    messages: { role: "user" | "assistant" | "system", content: string }[],
    model: string = "gpt-5.2",
    currentContent?: string
): Promise<ActionState & { content?: string }> {
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    // Validation
    const validated = CleanedGenerateContentSchema.safeParse({ messages, model, currentContent });
    if (!validated.success) {
        return { error: "Invalid input format." };
    }

    // Get OpenAI Key
    const { data: keyData, error: keyError } = await supabase
        .from('vault_keys')
        .select('encrypted_value')
        .eq('user_id', user.id)
        .eq('provider', 'openai')
        .eq('is_active', true)
        .single();

    if (keyError || !keyData) {
        return { error: "OpenAI API key missing. Go to Settings > BYOK to add it." };
    }

    try {
        const apiKey = await decrypt(keyData.encrypted_value);

        // Prep system message
        const systemMessage = {
            role: "system",
            content: `You are an expert email marketing assistant and UI designer.
${currentContent ? `\nCURRENT EDITOR CONTENT:\n${currentContent}\n\n` : ''}

CRITICAL RULES:
1. **Visual Design**: Generate PREMIUM, MODERN, and MINIMALIST HTML emails. 
   - Use adequate padding (20px+).
   - Use system fonts (Arial, sans-serif) for clean rendering.
   - Use soft colors (whites, light grays #f9fafb) for backgrounds.
   - Buttons should be rounded and vibrant (e.g., #14b8a6 or #4f46e5).

2. **Variables**: YOU MUST ONLY USE THE FOLLOWING VARIABLES. DO NOT INVENT NEW ONES.
   - {{contact.first_name}}
   - {{contact.last_name}}
   - {{contact.email}}
   - {{contact.company}}
   - {{unsubscribe_url}} (Always put this in a footer)

   IF A USER ASKS FOR DATA NOT IN THIS LIST (like dates, times, durations), DO NOT USE A VARIABLE. WRITE PLACEHOLDER TEXT INSTEAD (e.g., "[Date]").

3. **Output**:
   - If user asks for code/layout: Return VALID, RESPONSIVE HTML.
   - Inline CSS only.
   - No markdown fences (\`\`\`html). Return raw code.
   - Do not wrap in <html> or <body> tags if you are just returning a snippet, but if creating a full email, include them.`
        };

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: validated.data.model,
                messages: [systemMessage, ...validated.data.messages],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("OpenAI API Error:", err);
            if (response.status === 401) return { error: "Invalid OpenAI API Key." };
            if (response.status === 429) return { error: "OpenAI Rate Limit Exceeded." };
            if (response.status === 500) return { error: "OpenAI Service Error." };
            if (response.status === 404) return { error: `Model '${validated.data.model}' not found.` };
            return { error: "Failed to generate content." };
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const cleanContent = content.replace(/^```html\n/, '').replace(/\n```$/, ''); // Helper cleanup just in case

        return { success: true, content: cleanContent };

    } catch (error) {
        console.error("Generation Error:", error);
        return { error: "Internal Server Error." };
    }
}

export async function getSenderIdentities() {
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('sender_identities')
        .select('id, email, name, verified')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching sender identities:', error);
        return [];
    }

    return data;
}
