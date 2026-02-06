'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Server, ExternalLink, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface StepApiKeysProps {
    onNext: () => void;
    onSkip: () => void;
}

export function StepApiKeys({ onNext, onSkip }: StepApiKeysProps) {
    const { toast } = useToast();
    const [openaiKey, setOpenaiKey] = useState("");
    const [resendKey, setResendKey] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!openaiKey && !resendKey) {
            onNext(); // Nothing to save, just proceed
            return;
        }

        setIsSaving(true);
        try {
            // Save keys concurrently
            const promises = [];
            if (openaiKey) {
                promises.push(fetch('/api/keys/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider: 'openai', key: openaiKey })
                }));
            }
            if (resendKey) {
                promises.push(fetch('/api/keys/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider: 'resend', key: resendKey })
                }));
            }

            await Promise.all(promises);
            toast({ title: "Keys Saved", description: "Your API keys have been securely stored." });
            onNext();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save keys. Please try again.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Connect your tools</h2>
                <p className="text-muted-foreground">
                    AutoMail AI powers up with OpenAI and Resend keys.
                </p>
            </div>

            <div className="flex-1 space-y-6">
                {/* OpenAI Input */}
                <div className="p-4 rounded-xl border bg-zinc-900/50 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium">
                            <div className="bg-green-500/10 p-2 rounded-lg text-green-500">
                                <Globe className="h-5 w-5" />
                            </div>
                            OpenAI
                        </div>
                        <a href="https://platform.openai.com/api-keys" target="_blank" className="text-xs text-primary flex items-center gap-1 hover:underline">
                            Get Key <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                    <div className="space-y-1">
                        <Input
                            placeholder="sk-..."
                            type="password"
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            className="bg-black/20 border-zinc-800 focus-visible:ring-primary/50"
                        />
                        <p className="text-[10px] text-muted-foreground">Used for AI email generation.</p>
                    </div>
                </div>

                {/* Resend Input */}
                <div className="p-4 rounded-xl border bg-zinc-900/50 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium">
                            <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                                <Server className="h-5 w-5" />
                            </div>
                            Resend
                        </div>
                        <a href="https://resend.com/api-keys" target="_blank" className="text-xs text-primary flex items-center gap-1 hover:underline">
                            Get Key <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                    <div className="space-y-1">
                        <Input
                            placeholder="re_..."
                            type="password"
                            value={resendKey}
                            onChange={(e) => setResendKey(e.target.value)}
                            className="bg-black/20 border-zinc-800 focus-visible:ring-primary/50"
                        />
                        <p className="text-[10px] text-muted-foreground">Used for sending emails.</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <Button variant="ghost" className="flex-1" onClick={onSkip} disabled={isSaving}>
                    Skip for now
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {openaiKey || resendKey ? "Save & Continue" : "Continue"}
                </Button>
            </div>
        </div>
    );
}
