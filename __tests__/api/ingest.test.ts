/**
 * @jest-environment node
 */
import { POST } from '../../app/api/ingest/route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

// Chainable mock implementation
const mockSupabaseChain = {
    from: jest.fn(() => ({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: jest.fn(() => ({ eq: mockEq })),
        upsert: jest.fn(() => ({ select: jest.fn(() => ({ single: mockSingle })) })),
    })),
    // Helper to reset mocks
    _reset: () => {
        mockInsert.mockReset();
        mockSelect.mockReset();
        mockUpdate.mockReset();
        mockEq.mockReset();
        mockSingle.mockReset();
        // Default returns to allow chaining
        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ single: mockSingle, eq: mockEq });
        mockSingle.mockResolvedValue({ data: null, error: null });
        mockInsert.mockResolvedValue({ data: null, error: null });
    }
};

jest.mock('@/utils/supabase/server', () => ({
    createClient: () => ({
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) }
    })
}));

// We need to mock the admin client inside the route, which uses createClient from supabase-js
jest.mock('@supabase/supabase-js', () => ({
    createClient: () => mockSupabaseChain
}));

describe('POST /api/ingest', () => {
    beforeEach(() => {
        mockSupabaseChain._reset();
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://mock-url';
    });

    it('should validate API key', async () => {
        const req = new NextRequest('http://localhost/api/ingest', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer invalid-key' },
            body: JSON.stringify({ email: 'test@example.com' })
        });

        // Mock Key Check
        mockSelect.mockReturnValueOnce({ eq: mockEq });
        mockEq.mockReturnValueOnce({ single: mockSingle }); // Key Query
        mockSingle.mockResolvedValueOnce({ data: null, error: 'Not found' });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(401);
        expect(json.error).toBe("Invalid API Key");
    });

    it('should queue automation when event matches', async () => {
        const req = new NextRequest('http://localhost/api/ingest', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer valid-key' },
            body: JSON.stringify({
                email: 'user@example.com',
                event: 'user.signup'
            })
        });

        // 1. Mock Key Validation Success
        mockSelect.mockReturnValueOnce({ eq: mockEq });
        mockEq.mockReturnValueOnce({ single: mockSingle });
        mockSingle.mockResolvedValueOnce({
            data: { id: 'key_123', user_id: 'user_123', name: 'Test Key' },
            error: null
        });

        // 2. Mock Contact Upsert
        // The implementation calls upsert -> select -> single
        mockSupabaseChain.from.mockImplementation((table) => {
            if (table === 'webhook_keys') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { user_id: 'user_123' } }) }) }) };
            if (table === 'contacts') return {
                select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'contact_123' } }) }) }) }),
                update: () => ({ eq: () => Promise.resolve({ error: null }) })
            };
            // 3. Mock Automation Fetching for Event
            if (table === 'automations') return {
                select: () => ({
                    eq: () => ({
                        eq: () => ({
                            eq: () => Promise.resolve({
                                data: [{
                                    id: 'auto_1',
                                    trigger_type: 'event',
                                    workflow_config: { trigger: { type: 'event', config: { event: 'user.signup' } } }
                                }]
                            })
                        })
                    })
                })
            };
            if (table === 'automation_queue') return { insert: mockInsert };
            if (table === 'webhook_usage') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }), insert: jest.fn() };
            return { select: jest.fn() };
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.triggered).toBe(1);
        expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                automation_id: 'auto_1',
                contact_id: 'contact_123'
            })
        ]));
    });
});
