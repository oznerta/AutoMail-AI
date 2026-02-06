import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Resend } from 'resend';
import { decrypt } from '@/lib/crypto';

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient() as any;
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { templateId, senderId, recipientEmail } = body;

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

        // Send test email
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: recipientEmail,
            subject: template.subject || 'Test Email',
            html: template.content || '<p>No content</p>',
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
