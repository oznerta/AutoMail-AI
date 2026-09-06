/**
 * @jest-environment node
 */
import { POST, GET } from '../../app/api/unsubscribe/route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockUpdate = jest.fn();
const mockEq = jest.fn();

const mockSupabaseChain = {
    from: jest.fn(() => ({
        update: mockUpdate,
    })),
    _reset: () => {
        mockUpdate.mockReset();
        mockEq.mockReset();

        mockUpdate.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ eq: mockEq });
        mockEq.mockResolvedValue({ data: null, error: null });
    }
};

jest.mock('@/utils/supabase/server', () => ({
    createClient: () => ({}),
    createAdminClient: () => mockSupabaseChain
}));

describe('Unsubscribe API Route', () => {
    beforeEach(() => {
        mockSupabaseChain._reset();
    });

    it('POST should reject requests without identifier', async () => {
        const req = new NextRequest('http://localhost/api/unsubscribe', {
            method: 'POST',
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Missing contact identifier');
    });

    it('POST should successfully unsubscribe with contact id', async () => {
        const req = new NextRequest('http://localhost/api/unsubscribe?id=contact_123', {
            method: 'POST',
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(mockSupabaseChain.from).toHaveBeenCalledWith('contacts');
        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'unsubscribed' })
        );
        expect(mockEq).toHaveBeenCalledWith('id', 'contact_123');
    });

    it('POST should successfully unsubscribe with email', async () => {
        const req = new NextRequest('http://localhost/api/unsubscribe?email=user@example.com', {
            method: 'POST',
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(mockEq).toHaveBeenCalledWith('email', 'user@example.com');
    });

    it('GET should redirect to confirmation page', async () => {
        const req = new NextRequest('http://localhost/api/unsubscribe?email=user@example.com', {
            method: 'GET',
        });
        const res = await GET(req);
        expect(res.status).toBe(307); // NextResponse.redirect status
        expect(res.headers.get('location')).toContain('/unsubscribe?success=true&email=user%40example.com');
    });
});
