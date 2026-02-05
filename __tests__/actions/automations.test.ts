/**
 * @jest-environment node
 */
import { generateWebhookToken, createAutomation } from '../../app/(protected)/automations/actions';

// Mock Server Client
const mockGetUser = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/utils/supabase/server', () => ({
    createClient: () => ({
        auth: { getUser: mockGetUser },
        from: (table: string) => ({
            select: () => ({ single: mockSingle }),
            insert: mockInsert,
            update: mockUpdate,
            eq: mockEq
        })
    })
}));

// Mock revalidatePath
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn()
}));

describe('Automation Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUpdate.mockReturnValue({ eq: () => ({ eq: Promise.resolve({ error: null }) }) });
        mockEq.mockReturnValue({ eq: Promise.resolve({ error: null }) }); // Chain
    });

    describe('generateWebhookToken', () => {
        it('should require authentication', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const res = await generateWebhookToken('auto_1');
            expect(res.error).toBe('Unauthorized');
        });

        it('should update the token and return it', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'user_1' } } });

            // Mock chain for update
            const mockUpdateChain = jest.fn().mockResolvedValue({ error: null });
            const mockEqUser = jest.fn().mockReturnValue(Promise.resolve({ error: null }));
            const mockEqId = jest.fn().mockReturnValue({ eq: mockEqUser });

            mockUpdate.mockImplementation(() => ({ eq: mockEqId }));

            const res = await generateWebhookToken('auto_1');

            expect(res.success).toBe(true);
            expect(res.token).toMatch(/^wh_/); // Should start with wh_

            // Verify DB call
            expect(mockUpdate).toHaveBeenCalledWith({ webhook_token: expect.stringMatching(/^wh_/) });
        });
    });
});
