import { createClient } from '@/utils/supabase/server';
import { encrypt } from '@/lib/crypto';
import { z } from 'zod';
import { Json } from '@/types/supabase';

// Input validation schema
const SaveKeySchema = z.object({
    provider: z.string().min(1, 'Provider is required'),
    key: z.string().min(1, 'API Key is required'),
    key_name: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});

export async function POST(request: Request) {
    try {
        // 1. Authenticate User
        const supabase = createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return Response.json(
                { error: 'Unauthorized: Please sign in to save keys' },
                { status: 401 }
            );
        }

        // 2. Validate Input
        const body = await request.json();
        const validationResult = SaveKeySchema.safeParse(body);

        if (!validationResult.success) {
            return Response.json(
                { error: 'Validation Error', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const { provider, key, key_name, metadata } = validationResult.data;

        // 3. Encrypt Key
        // We encrypt the key server-side before storing it
        const encryptedData = await encrypt(key);

        // 4. Store in Database
        // Cast to unknown then Json to satisfy strict type checking
        const encryptedJson = encryptedData as unknown as Json;
        const metadataJson = (metadata || {}) as unknown as Json;

        // Note: We don't verify the key with the provider here (that's a separate step/endpoint)
        // We just securely store it.
        // Explicitly cast to any to avoid recursive type depth issues with Supabase definitions
        const { data, error: dbError } = await (supabase
            .from('vault_keys') as any)
            .insert({
                user_id: user.id,
                provider,
                key_name: key_name || `${provider} Key`,
                encrypted_value: encryptedJson,
                metadata: metadataJson,
                is_active: true,
            })
            .select('id')
            .single();

        if (dbError) {
            console.error('Database Error:', dbError);
            return Response.json(
                { error: 'Failed to save key' },
                { status: 500 }
            );
        }

        // 5. Success
        return Response.json({
            success: true,
            id: data.id,
            message: 'Key saved and encrypted successfully',
        });

    } catch (error) {
        console.error('Unexpected Error:', error);
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
