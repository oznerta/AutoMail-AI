import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

function sanitizeCsvCell(val: any): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (/^[=+\-@\t\r]/.test(str)) {
        return `'${str}`;
    }
    return str;
}

export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: contacts, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const rows = (contacts || []).map(c => {
            const row: Record<string, string> = {
                Email: sanitizeCsvCell(c.email),
                FirstName: sanitizeCsvCell(c.first_name || ''),
                LastName: sanitizeCsvCell(c.last_name || ''),
                Company: sanitizeCsvCell(c.company || ''),
                Phone: sanitizeCsvCell(c.phone || ''),
                Tags: sanitizeCsvCell((Array.isArray(c.tags) ? c.tags : []).join(', ')),
                Status: sanitizeCsvCell(c.status || 'active'),
                Source: sanitizeCsvCell(c.source || ''),
                CreatedAt: sanitizeCsvCell(c.created_at),
            };

            if (c.custom_fields && typeof c.custom_fields === 'object' && !Array.isArray(c.custom_fields)) {
                Object.entries(c.custom_fields).forEach(([k, v]) => {
                    row[k] = sanitizeCsvCell(v);
                });
            }

            return row;
        });

        const csv = Papa.unparse(rows);
        const filename = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
    }
}
