'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithGoogle } from "@/utils/supabase/client"
import { signUpWithEmail } from "@/utils/supabase/auth"
import { AuthError } from "@/components/ui/auth-error"
import { signupSchema } from "@/lib/validation/auth"
import { Loader2 } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { AuthFeatureCard } from "@/components/auth/auth-feature-card"
import dynamic from "next/dynamic"

// Dynamically import ThreeScene to avoid SSR issues with Three.js
const ThreeScene = dynamic(() => import("@/components/landing/ThreeScene"), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-zinc-900" />,
})

export default function SignupPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        const result = signupSchema.safeParse({ email, password })
        if (!result.success) {
            setError(result.error.errors[0].message)
            setIsLoading(false)
            return
        }

        const { error: authError } = await signUpWithEmail(email, password)

        if (authError) {
            setError(authError.message)
            setIsLoading(false)
            return
        }

        setIsSuccess(true)
        setIsLoading(false)
    }

    const handleGoogleLogin = async () => {
        setError(null)
        const { error: authError } = await signInWithGoogle()
        if (authError) {
            setError("Failed to sign in with Google. Please try again.")
        }
    }

    if (isSuccess) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
                <div className="max-w-md w-full space-y-8 text-center">
                    <Logo className="mx-auto" />
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Check your email
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        We sent you a confirmation link to <span className="font-medium text-zinc-900 dark:text-zinc-200">{email}</span>.
                        <br />
                        Click the link to verify your account and sign in.
                    </p>
                    <div className="mt-8">
                        <Link href="/login">
                            <Button variant="outline" className="w-full">
                                Back to Sign In
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background">
            {/* Left Side: Visual/Branding */}
            <div className="hidden lg:flex flex-col justify-between p-10 relative bg-zinc-900 text-white dark:border-r border-zinc-800 overflow-hidden">
                {/* 3D Background Layer */}
                <div className="absolute inset-0 z-0">
                    <ThreeScene />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/50 to-zinc-900/30 pointer-events-none" />
                </div>

                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Logo showText={false} className="scale-110" href="/" />
                    <span className="ml-3 font-bold text-2xl tracking-tight text-white drop-shadow-md">AutoMail AI</span>
                </div>

                <div className="relative z-20 mt-auto flex justify-center lg:justify-start">
                    <AuthFeatureCard />
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black relative z-10 min-h-screen lg:min-h-0">
                <div className="mx-auto w-full max-w-sm space-y-8">
                    {/* Mobile Logo */}
                    <div className="flex flex-col space-y-2 text-center">
                        <div className="lg:hidden flex justify-center mb-4">
                            <Logo href="/" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Create an account
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Enter your email to get started with AutoMail AI
                        </p>
                    </div>

                    <div className="space-y-6">
                        <AuthError error={error} />
                        <form onSubmit={handleEmailSignup} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-600 dark:text-zinc-400">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    className="bg-white dark:bg-zinc-900/50 h-10 border-zinc-200 dark:border-zinc-800 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-600 dark:text-zinc-400">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    className="bg-white dark:bg-zinc-900/50 h-10 border-zinc-200 dark:border-zinc-800 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Must be at least 8 characters long.
                                </p>
                            </div>
                            <Button className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-teal-600 dark:hover:bg-teal-500 shadow-md transition-all hover:scale-[1.01]" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign Up
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-zinc-50 dark:bg-black px-2 text-zinc-500">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Google
                        </Button>

                        <p className="px-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="font-semibold text-zinc-900 dark:text-zinc-200 hover:text-teal-600 dark:hover:text-teal-400 hover:underline transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
