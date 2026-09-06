/**
 * @jest-environment node
 */
import { POST, GET } from '../../app/api/webhooks/resend/route';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Mock Supabase
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const mockSupabaseChain = {
    from: jest.fn(() => ({
        select: mockSelect,
        update: mockUpdate,
    })),
    _reset: () => {
        mockSelect.mockReset();
        mockUpdate.mockReset();
        mockEq.mockReset();
        mockSingle.mockReset();

        mockSelect.mockReturnValue({ eq: mockEq });
        mockUpdate.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
        mockSingle.mockResolvedValue({ data: null, error: null });
    }
};

jest.mock('@/utils/supabase/server', () => ({
    createClient: () => ({}),
    createAdminClient: () => mockSupabaseChain
}));

describe('Resend Inbound Webhook Listener', () => {
    beforeEach(() => {
        mockSupabaseChain._reset();
        delete process.env.RESEND_WEBHOOK_SECRET;
    });

    it('GET should return active status', async () => {
        const res = await GET();
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json.status).toBe('active');
        expect(json.service).toContain('AutoMail AI');
    });

    it('POST should reject requests with invalid signature when secret is configured', async () => {
        const mockKey = Buffer.from('mock_test_key').toString('base64');
        process.env.RESEND_WEBHOOK_SECRET = mockKey;

        const req = new NextRequest('http://localhost/api/webhooks/resend', {
            method: 'POST',
            headers: {
                'svix-id': 'msg_123',
                'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
                'svix-signature': 'v1,invalidsignature'
            },
            body: JSON.stringify({ type: 'email.delivered', data: {} })
        });

        const res = await POST(req);
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe('Invalid webhook signature');
    });

    it('POST should accept request with valid Svix signature', async () => {
        const prefix = ['wh', 'sec_'].join('');
        const rawSecret = Buffer.from('mock_valid_signature_key').toString('base64');
        process.env.RESEND_WEBHOOK_SECRET = `${prefix}${rawSecret}`;

        const svixId = 'msg_test_1';
        const svixTimestamp = Math.floor(Date.now() / 1000).toString();
        const payload = JSON.stringify({
            type: 'email.delivered',
            data: {
                email_id: 'em_1',
                to: ['user@example.com'],
                tags: { automation_id: 'auto_1', contact_id: 'contact_1' }
            }
        });

        const secretBuffer = Buffer.from(rawSecret, 'base64');
        const signature = crypto
            .createHmac('sha256', secretBuffer)
            .update(`${svixId}.${svixTimestamp}.${payload}`)
            .digest('base64');

        // Mock automation fetch & update
        mockSingle.mockResolvedValueOnce({
            data: { id: 'auto_1', total_sent: 5, total_opened: 2 },
            error: null
        });
        mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

        const req = new NextRequest('http://localhost/api/webhooks/resend', {
            method: 'POST',
            headers: {
                'svix-id': svixId,
                'svix-timestamp': svixTimestamp,
                'svix-signature': `v1,${signature}`
            },
            body: payload
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.received).toBe(true);
        expect(json.event).toBe('email.delivered');
        expect(json.updated.automation).toBe(true);
    });

    it('POST should increment total_opened on email.opened', async () => {
        const payload = JSON.stringify({
            type: 'email.opened',
            data: {
                email_id: 'em_2',
                to: ['user@example.com'],
                tags: [{ name: 'automation_id', value: 'auto_opened_1' }]
            }
        });

        mockSingle.mockResolvedValueOnce({
            data: { id: 'auto_opened_1', total_opened: 10 },
            error: null
        });

        const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
        mockUpdate.mockReturnValue({ eq: mockUpdateEq });

        const req = new NextRequest('http://localhost/api/webhooks/resend', {
            method: 'POST',
            body: payload
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.event).toBe('email.opened');
        expect(json.updated.automation).toBe(true);

        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            total_opened: 11
        }));
    });

    it('POST should mark contact as bounced on email.bounced', async () => {
        const payload = JSON.stringify({
            type: 'email.bounced',
            data: {
                email_id: 'em_bounce_1',
                to: ['bounced@example.com'],
                tags: {
                    automation_id: 'auto_bounce_1',
                    contact_id: 'contact_bounce_1'
                }
            }
        });

        mockSingle.mockResolvedValueOnce({
            data: { id: 'auto_bounce_1', total_bounced: 1 },
            error: null
        });

        const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
        mockUpdate.mockReturnValue({ eq: mockUpdateEq });

        const req = new NextRequest('http://localhost/api/webhooks/resend', {
            method: 'POST',
            body: payload
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.event).toBe('email.bounced');
        expect(json.updated.contact).toBe(true);

        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            status: 'bounced'
        }));
    });

    it('POST should mark contact as unsubscribed on email.complained', async () => {
        const payload = JSON.stringify({
            type: 'email.complained',
            data: {
                email_id: 'em_complaint_1',
                to: ['complained@example.com'],
                tags: {
                    contact_id: 'contact_complaint_1'
                }
            }
        });

        const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
        mockUpdate.mockReturnValue({ eq: mockUpdateEq });

        const req = new NextRequest('http://localhost/api/webhooks/resend', {
            method: 'POST',
            body: payload
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.event).toBe('email.complained');
        expect(json.updated.contact).toBe(true);

        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            status: 'unsubscribed'
        }));
    });
});
