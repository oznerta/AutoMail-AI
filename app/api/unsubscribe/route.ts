import { createAdminClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const contactId = searchParams.get('id') || searchParams.get('contact_id');
        const email = searchParams.get('email');

        if (!contactId && !email) {
            return NextResponse.json({ error: 'Missing contact identifier' }, { status: 400 });
        }

        const supabase = createAdminClient();

        let query = supabase.from('contacts').update({
            status: 'unsubscribed',
            updated_at: new Date().toISOString()
        });

        if (contactId) {
            query = query.eq('id', contactId);
        } else if (email) {
            query = query.eq('email', email);
        }

        const { error } = await query;
        if (error) {
            console.error('[Unsubscribe API] Failed to update contact status:', error);
            return NextResponse.json({ error: 'Failed to process unsubscribe request' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Successfully unsubscribed' }, { status: 200 });
    } catch (error: any) {
        console.error('[Unsubscribe API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const contactId = searchParams.get('id') || searchParams.get('contact_id');
        const email = searchParams.get('email');

        if (contactId || email) {
            const supabase = createAdminClient();
            let query = supabase.from('contacts').update({
                status: 'unsubscribed',
                updated_at: new Date().toISOString()
            });

            if (contactId) {
                query = query.eq('id', contactId);
            } else if (email) {
                query = query.eq('email', email);
            }

            await query;
        }

        const redirectUrl = new URL('/unsubscribe', request.url);
        redirectUrl.searchParams.set('success', 'true');
        if (email) redirectUrl.searchParams.set('email', email);

        return NextResponse.redirect(redirectUrl);
    } catch (error: any) {
        console.error('[Unsubscribe GET] Error:', error);
        return NextResponse.redirect(new URL('/unsubscribe?error=failed', request.url));
    }
}
