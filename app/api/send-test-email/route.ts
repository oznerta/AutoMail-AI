import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Resend } from 'resend';
import { decrypt } from '@/lib/crypto';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient() as any;
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { templateId, senderId, recipientEmail, fallbacks } = body;

        if (!templateId || !senderId || !recipientEmail) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Fetch template
        const { data: template, error: templateError } = await supabase
            .from('email_templates')
            .select('subject, content')
            .eq('id', templateId)
            .eq('user_id', user.id)
            .single();

        if (templateError || !template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // Fetch sender identity
        const { data: sender, error: senderError } = await supabase
            .from('sender_identities')
            .select('email, name')
            .eq('id', senderId)
            .eq('user_id', user.id)
            .single();

        if (senderError || !sender) {
            return NextResponse.json(
                { error: 'Sender not found' },
                { status: 404 }
            );
        }

        // Fetch Resend API key
        const { data: keyData, error: keyError } = await supabase
            .from('vault_keys')
            .select('encrypted_value')
            .eq('user_id', user.id)
            .eq('provider', 'resend')
            .eq('is_active', true)
            .single();

        if (keyError || !keyData) {
            return NextResponse.json(
                { error: 'Resend API key not configured' },
                { status: 400 }
            );
        }

        // Decrypt API key
        const apiKey = await decrypt(keyData.encrypted_value);
        const resend = new Resend(apiKey);

        // --- Variable Substitution Logic ---
        // 1. Try to find the recipient in contacts to use real data
        const { data: contact } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', user.id)
            .eq('email', recipientEmail)
            .order('updated_at', { ascending: false }) // Handle duplicates: use most recent
            .limit(1)
            .single();

        // 2. Prepare variables
        const variables: Record<string, string> = {
            email: recipientEmail,
            first_name: contact?.first_name || '',
            last_name: contact?.last_name || '',
            company: contact?.company || '',
            plan_tier: contact?.tags?.includes('Pro') ? 'Pro' : 'Free', // Example derived var
        };

        // 3. Process Content (Dynamic Import to avoid top-level issues if any)
        const { processEmailContent } = await import('@/utils/email-processor');

        const subject = processEmailContent(template.subject || 'Test Email', variables, fallbacks);
        const html = processEmailContent(template.content || '<p>No content</p>', variables, fallbacks);


        // Send test email
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: recipientEmail,
            subject: subject,
            html: html,
        });

        if (emailError) {
            console.error('Resend error:', emailError);
            return NextResponse.json(
                { error: 'Failed to send email', details: emailError },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            emailId: emailData?.id,
            message: 'Test email sent successfully'
        });

    } catch (error: any) {
        console.error('Test email error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
