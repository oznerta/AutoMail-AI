'use client'

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthError } from "@/components/ui/auth-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword } from "@/utils/supabase/auth";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setIsLoading(true);

        // Basic email validation
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            setIsLoading(false);
            return;
        }

        // Request password reset
        const { error: authError } = await resetPassword(email);

        if (authError) {
            setError(authError.message);
            setIsLoading(false);
            return;
        }

        // Success
        setSuccess(true);
        setIsLoading(false);
    };

    return (
        <Card className="mx-auto max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                    Enter your email address and we&apos;ll send you a link to reset your password
                </CardDescription>
            </CardHeader>
            <CardContent>
                {success ? (
                    <Alert className="mb-4 border-green-500 bg-green-50 text-green-900">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                            Check your email! We&apos;ve sent you a password reset link.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <>
                        <AuthError error={error} />
                        <form onSubmit={handleResetPassword} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </form>
                    </>
                )}
                <div className="mt-4 text-center text-sm">
                    Remember your password?{" "}
                    <Link href="/login" className="underline">
                        Back to login
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
