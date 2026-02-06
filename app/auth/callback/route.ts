import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.headers.get('Cookie')?.split('; ').find((c) => c.startsWith(`${name}=`))?.split('=')[1]
                    },
                    set(name: string, value: string, options: any) {
                        // Cookie setting is handled by the response
                    },
                    remove(name: string, options: any) {
                        // Cookie removal is handled by the response
                    },
                },
            }
        )

        // We need to pass a mutable request/response to exchangeCodeForSession ideally, 
        // but with @supabase/ssr in a route handler, we follow the pattern of creating a client
        // that can set cookies on the response.
        // However, the standard pattern for Next.js Route Handlers with @supabase/ssr is slightly different.
        // Let's use the robust pattern from Supabase docs.

        const cookieStore = {
            getAll() {
                return request.headers.get('Cookie')?.split('; ').map(c => {
                    const [name, value] = c.split('=')
                    return { name, value }
                }) || []
            },
            set(name: string, value: string, options: any) {
                // we will set this on the response
            }
        }

        // Re-creating client with proper cookie handling for the exchange
        const supabaseResponse = NextResponse.redirect(`${origin}${next}`)

        const sb = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.headers.get('Cookie')?.split('; ').find((c) => c.startsWith(`${name}=`))?.split('=')[1]
                    },
                    set(name: string, value: string, options: any) {
                        supabaseResponse.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: any) {
                        supabaseResponse.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        const { error } = await sb.auth.exchangeCodeForSession(code)

        if (!error) {
            return supabaseResponse
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
