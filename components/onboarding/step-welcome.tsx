'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface StepWelcomeProps {
    onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
    return (
        <div className="flex flex-col h-full justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Welcome to the future of email
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Let's set up your <br />
                    <span className="text-primary">Growth Engine</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                    You're moments away from automating your outreach. We'll help you import your contacts and connect your AI tools in just a few steps.
                </p>
            </div>

            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="text-2xl mb-2">🚀</div>
                        <h3 className="font-semibold">Import Contacts</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Bulk upload your list to start sending immediately.
                        </p>
                    </div>
                    <div className="p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="text-2xl mb-2">🤖</div>
                        <h3 className="font-semibold">Connect AI</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Link OpenAI & Resend for smart automation.
                        </p>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <Button size="lg" className="w-full md:w-auto text-base px-8 h-12" onClick={onNext}>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
