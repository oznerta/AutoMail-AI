import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Mail, Send, Shield, Zap } from "lucide-react";

import { Logo } from "@/components/ui/logo";

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="px-4 lg:px-6 h-14 flex items-center">
                <Logo />
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link
                        className="text-sm font-medium hover:underline underline-offset-4"
                        href="/login"
                    >
                        Login
                    </Link>
                    <Link
                        className="text-sm font-medium hover:underline underline-offset-4"
                        href="/signup"
                    >
                        Sign Up
                    </Link>
                </nav>
            </header>
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                            <div className="flex flex-col justify-center space-y-4">
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                                        User-Owned Email Automation
                                    </h1>
                                    <p className="max-w-[600px] text-muted-foreground md:text-xl">
                                        Bring your own keys (OpenAI + Resend). We provide the AI
                                        builder and automation engine. You own the data.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                                    <Link href="/signup">
                                        <Button size="lg" className="w-full min-[400px]:w-auto">
                                            Get Started
                                            <Zap className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link href="#features">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="w-full min-[400px]:w-auto"
                                        >
                                            Learn More
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="relative w-full aspect-video rounded-xl bg-muted/50 border overflow-hidden shadow-2xl">
                                    {/* Placeholder for Hero Image/Animation */}
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                        Dashboard Preview
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="features"
                    className="w-full py-12 md:py-24 lg:py-32 bg-muted/40"
                >
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="space-y-2">
                                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                                    Key Features
                                </div>
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                                    Why AutoMail AI?
                                </h2>
                                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                    The unified platform for developers who want the power of a CRM
                                    without the lock-in.
                                </p>
                            </div>
                        </div>
                        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center space-y-2 text-center">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Shield className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold">Secure Vault</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Your API keys are encrypted with AES-256. We function as a
                                            secure pass-through layer.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center space-y-2 text-center">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Mail className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold">AI Email Builder</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Generate responsive HTML emails from text prompts. No
                                            coding required.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center space-y-2 text-center">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Send className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold">Webhook Engine</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Connect any form or app to your list via a secure, unique
                                            webhook URL.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-muted-foreground">
                    © 2026 AutoMail AI. All rights reserved.
                </p>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-xs hover:underline underline-offset-4" href="#">
                        Terms of Service
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="#">
                        Privacy
                    </Link>
                </nav>
            </footer>
        </div>
    );
}
