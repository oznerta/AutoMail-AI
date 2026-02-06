'use client'

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { KeyRound, Lock, Server, BookOpen, ShieldAlert, Trash2, Mail, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WebhookKeysList } from "@/components/settings/webhook-keys-list";
import { SenderIdentitiesList } from "@/components/settings/sender-identities-list";
import { motion, AnimatePresence } from "framer-motion";

import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface KeyStatus {
    openai: boolean;
    resend: boolean;
}

function BYOKConfigTab() {
    const [openaiKey, setOpenaiKey] = useState("");
    const [resendKey, setResendKey] = useState("");
    const [savingOpenAI, setSavingOpenAI] = useState(false);
    const [savingResend, setSavingResend] = useState(false);
    const [keyStatus, setKeyStatus] = useState<KeyStatus>({ openai: false, resend: false });
    const { toast } = useToast();

    useEffect(() => {
        checkKeys();
    }, []);

    const checkKeys = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('vault_keys')
            .select('provider')
            .eq('user_id', user.id)
            .returns<{ provider: string }[]>();

        if (data) {
            setKeyStatus({
                openai: data.some(k => k.provider === 'openai'),
                resend: data.some(k => k.provider === 'resend')
            });
        }
    };

    const handleSaveKey = async (provider: string, key: string, setSaving: (v: boolean) => void) => {
        if (!key) {
            toast({
                title: "Error",
                description: "Please enter an API key.",
                variant: "destructive"
            });
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/keys/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, key })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save key");
            }

            toast({
                title: "Success",
                description: `${provider === 'openai' ? 'OpenAI' : 'Resend'} API key updated successfully.`
            });

            if (provider === 'openai') setOpenaiKey("");
            if (provider === 'resend') setResendKey("");

            checkKeys();

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="border-muted/60 shadow-md bg-gradient-to-br from-card to-muted/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    API Keys
                </CardTitle>
                <CardDescription>
                    AutoMail AI encrypts your keys using AES-256 before storing them in the vault.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="openai-key">OpenAI API Key</Label>
                        {keyStatus.openai && (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                <KeyRound className="h-3 w-3" /> Configured
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="openai-key"
                                type="password"
                                placeholder={keyStatus.openai ? "••••••••••••••••••••••••" : "sk-..."}
                                className="pl-9"
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => handleSaveKey('openai', openaiKey, setSavingOpenAI)}
                            disabled={savingOpenAI || !openaiKey}
                        >
                            {savingOpenAI ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                        </Button>
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground">
                        Required for the AI Email Builder implementation.
                    </p>
                </div>

                <Separator />

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="resend-key">Resend API Key</Label>
                        {keyStatus.resend && (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                <KeyRound className="h-3 w-3" /> Configured
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Server className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="resend-key"
                                type="password"
                                placeholder={keyStatus.resend ? "••••••••••••••••••••••••" : "re_..."}
                                className="pl-9"
                                value={resendKey}
                                onChange={(e) => setResendKey(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => handleSaveKey('resend', resendKey, setSavingResend)}
                            disabled={savingResend || !resendKey}
                        >
                            {savingResend ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                        </Button>
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground">
                        Required for sending emails via automation engine.
                    </p>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 bg-muted/20">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    Your keys are never shared with third parties except for the respective API providers.
                </div>
            </CardFooter>
        </Card>
    );
}

const TABS = [
    { id: 'account', label: 'Account Security', icon: ShieldAlert },
    { id: 'byok', label: 'BYOK Config', icon: KeyRound },
    { id: 'senders', label: 'Senders', icon: Mail },
    { id: 'dev', label: 'Developers', icon: Terminal },
]

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'account';
    const [webhookKeys, setWebhookKeys] = useState<any[]>([]);
    const [userEmail, setUserEmail] = useState<string>("");

    const fetchData = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserEmail(user.email || "");

            if (currentTab === 'senders') {
                const { data } = await supabase
                    .from('sender_identities')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                if (data) setWebhookKeys(data);
            } else {
                const { data } = await supabase
                    .from('webhook_keys')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                if (data) setWebhookKeys(data);
            }
        }
    }, [currentTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const setActiveTab = (tab: string) => {
        router.push(`/settings?tab=${tab}`);
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your preferences and configurations.
                </p>
            </div>

            {/* Custom Animated Tabs */}
            <div className="flex w-full items-center border-b overflow-x-auto gap-6 pb-px">
                {TABS.map((tab) => {
                    const isActive = currentTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors hover:text-foreground/80 outline-none select-none",
                                isActive ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    )
                })}
            </div>

            <div className="grid gap-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="w-full"
                    >
                        {/* Account Tab (Security & Danger Zone) */}
                        {currentTab === 'account' && (
                            <div className="space-y-6">
                                <Card className="border-muted/60 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Lock className="h-5 w-5 text-primary" />
                                            Security
                                        </CardTitle>
                                        <CardDescription>
                                            Update your password and account security settings.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="current-password">Current Password</Label>
                                            <Input id="current-password" type="password" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="new-password">New Password</Label>
                                            <Input id="new-password" type="password" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                                            <Input id="confirm-password" type="password" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="border-t px-6 py-4">
                                        <Button>Update Password</Button>
                                    </CardFooter>
                                </Card>

                                <Card className="border-muted/60 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Mail className="h-5 w-5 text-primary" />
                                            Email Address
                                        </CardTitle>
                                        <CardDescription>
                                            Update your primary email address.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Current Email</Label>
                                            <Input id="email" type="email" value={userEmail || "Loading..."} disabled className="bg-muted" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="new-email">New Email Address</Label>
                                            <Input id="new-email" type="email" placeholder="new@example.com" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="border-t px-6 py-4">
                                        <Button variant="outline">Update Email</Button>
                                    </CardFooter>
                                </Card>

                                <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-destructive flex items-center gap-2">
                                            <Trash2 className="h-5 w-5" />
                                            Danger Zone
                                        </CardTitle>
                                        <CardDescription className="text-destructive/80">
                                            Permanently delete your account and all associated data. This action cannot be undone.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                                            <ShieldAlert className="h-4 w-4" />
                                            <AlertTitle>Warning</AlertTitle>
                                            <AlertDescription>
                                                Deleting your account will remove: All contacts, Automations, API configurations, and History.
                                            </AlertDescription>
                                        </Alert>
                                    </CardContent>
                                    <CardFooter className="border-t border-destructive/20 px-6 py-4 flex justify-end">
                                        <Button variant="destructive">Delete Account</Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        )}

                        {/* BYOK Config Tab */}
                        {currentTab === 'byok' && (
                            <BYOKConfigTab />
                        )}

                        {/* Developers Tab */}
                        {currentTab === 'dev' && (
                            <WebhookKeysList keys={webhookKeys} />
                        )}

                        {/* Senders Tab */}
                        {currentTab === 'senders' && (
                            <SenderIdentitiesList senders={webhookKeys} onUpdate={fetchData} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div>Loading settings...</div>}>
            <SettingsContent />
        </Suspense>
    )
}
