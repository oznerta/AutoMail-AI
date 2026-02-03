'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { signInWithGoogle } from "@/utils/supabase/client";
import { signUpWithEmail } from "@/utils/supabase/auth";
import { AuthError } from "@/components/ui/auth-error";
import { PasswordStrength } from "@/components/ui/password-strength";
import { signupSchema } from "@/lib/validation/auth";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Validate input
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
            setError(result.error.errors[0].message);
            setIsLoading(false);
            return;
        }

        // Attempt signup
        const { error: authError } = await signUpWithEmail(
            formData.email,
            formData.password,
            {
                firstName: formData.firstName,
                lastName: formData.lastName,
            }
        );

        if (authError) {
            setError(authError.message);
            setIsLoading(false);
            return;
        }

        // Success - redirect to verify email page or contacts
        router.push("/dashboard");
        router.refresh();
    };

    const handleGoogleSignup = async () => {
        setError(null);
        const { error: authError } = await signInWithGoogle();
        if (authError) {
            setError("Failed to sign up with Google. Please try again.");
        }
    };

    return (
        <Card className="mx-auto max-w-sm">
            <CardHeader>
                <CardTitle className="text-xl">Sign Up</CardTitle>
                <CardDescription>
                    Enter your information to create an account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <AuthError error={error} />
                <form onSubmit={handleSignup} className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="first-name">First name</Label>
                            <Input
                                id="first-name"
                                placeholder="Max"
                                value={formData.firstName}
                                onChange={handleChange("firstName")}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="last-name">Last name</Label>
                            <Input
                                id="last-name"
                                placeholder="Robinson"
                                value={formData.lastName}
                                onChange={handleChange("lastName")}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            value={formData.email}
                            onChange={handleChange("email")}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange("password")}
                            disabled={isLoading}
                            required
                        />
                        <PasswordStrength password={formData.password} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange("confirmPassword")}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Creating account..." : "Create an account"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGoogleSignup}
                        disabled={isLoading}
                    >
                        Sign up with Google
                    </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="underline">
                        Sign in
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
