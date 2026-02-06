'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface StepSenderIdentityProps {
    onNext: () => void;
    onBack: () => void;
}

export function StepSenderIdentity({ onNext, onBack }: StepSenderIdentityProps) {
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name || !email) {
            toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        const supabase: any = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // Save to sender_identities table
            const { error } = await supabase
                .from('sender_identities')
                .insert({
                    user_id: user.id,
                    name,
                    email,
                    is_verified: false // Assume Resend will verify
                });

            if (error) throw error;

            toast({ title: "Identity Saved", description: "Sender identity added successfully." });
            onNext(); // Finish
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Who is sending?</h2>
                <p className="text-muted-foreground">
                    Configure the "From" name and email address that will appear in your recipients' inboxes.
                </p>
            </div>

            <div className="flex-1 space-y-6">
                <div className="p-6 rounded-xl border bg-zinc-900/50 space-y-6">
                    <div className="grid gap-2">
                        <Label>From Name</Label>
                        <Input
                            placeholder="e.g. John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-black/20"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>From Email</Label>
                        <Input
                            placeholder="e.g. john@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-black/20"
                        />
                        <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-500/10 rounded-lg text-yellow-500 text-xs">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>
                                Note: You must verify this domain in Resend dashboard for emails to be delivered successfully.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-muted p-4 rounded-lg flex items-center gap-3">
                    <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center border">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-muted-foreground">Preview</div>
                        <div className="text-sm font-medium">
                            {name || "John Doe"} <span className="text-muted-foreground">&lt;{email || "john@company.com"}&gt;</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <Button variant="ghost" className="flex-1" onClick={onNext}>
                    Skip
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Finish Setup
                </Button>
            </div>
        </div>
    );
}
