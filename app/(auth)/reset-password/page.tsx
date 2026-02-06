'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthError } from "@/components/ui/auth-error";
import { PasswordStrength } from "@/components/ui/password-strength";
import { updatePassword } from "@/utils/supabase/auth";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthFeatureCard } from "@/components/auth/auth-feature-card";
import dynamic from "next/dynamic";
import Link from "next/link";

// Dynamically import ThreeScene to avoid SSR issues with Three.js
const ThreeScene = dynamic(() => import("@/components/landing/ThreeScene"), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-zinc-900" />,
})

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            setIsLoading(false);
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            setIsLoading(false);
            return;
        }

        // Update password
        const { error: authError } = await updatePassword(password);

        if (authError) {
            setError(authError.message);
            setIsLoading(false);
            return;
        }

        // Success - redirect to login
        router.push("/login");
    };

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
                            Set New Password
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Enter your new password below
                        </p>
                    </div>

                    <div className="space-y-6">
                        <AuthError error={error} />
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-600 dark:text-zinc-400">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    className="bg-white dark:bg-zinc-900/50 h-10 border-zinc-200 dark:border-zinc-800 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                />
                                <PasswordStrength password={password} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password" className="text-zinc-600 dark:text-zinc-400">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    className="bg-white dark:bg-zinc-900/50 h-10 border-zinc-200 dark:border-zinc-800 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                />
                            </div>
                            <Button className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-teal-600 dark:hover:bg-teal-500 shadow-md transition-all hover:scale-[1.01]" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Updating..." : "Update Password"}
                            </Button>
                        </form>

                        <p className="px-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            <Link
                                href="/login"
                                className="font-semibold text-zinc-900 dark:text-zinc-200 hover:text-teal-600 dark:hover:text-teal-400 hover:underline transition-colors"
                            >
                                Back to login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
