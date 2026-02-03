'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronRight, KeyRound, Mail, Rocket, ArrowRight, Sparkles, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { checkOnboardingStatus } from "./actions"
import { createWebhookKey } from "@/app/(protected)/settings/actions" // Basic fallback if needed, but we save keys via API

export default function OnboardingPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [step, setStep] = useState(0) // 0: Welcome, 1: OpenAI, 2: Resend, 3: Sender, 4: Finish
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<any>(null)

    // Form States
    const [openaiKey, setOpenaiKey] = useState("")
    const [resendKey, setResendKey] = useState("")
    const [senderName, setSenderName] = useState("")
    const [senderEmail, setSenderEmail] = useState("")

    useEffect(() => {
        const init = async () => {
            const s = await checkOnboardingStatus();
            if (s.isComplete) {
                // Already done? Maybe just redirect or show optional "Review"
                // For now, let's allow them to re-do or skip.
                // router.push('/dashboard') 
            }
            setStatus(s);
        }
        init();
    }, [])

    const handleSaveAPIKey = async (provider: string, key: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/keys/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, key })
            });

            if (!response.ok) throw new Error("Failed to save key");

            toast({ title: "Connected!", description: `${provider === 'openai' ? 'OpenAI' : 'Resend'} key saved.` });
            setStep(s => s + 1);
        } catch (error) {
            toast({ title: "Error", description: "Could not save API key. Please try again.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleAddSender = async () => {
        setLoading(true);
        // We reuse the server action from settings if possible, or call API equivalent. 
        // Let's rely on the server action we created in settings/actions.ts for senders.
        // Wait, I can't import server action directly inside client component usually unless passed or separate file. 
        // I'll import `addSenderIdentity` from settings actions if it's exported.
        // If not readily available, I'll use a fetch approach if I made an API for it, but settings used server action.
        // I'll assume `addSenderIdentity` is importable.

        try {
            const { addSenderIdentity } = await import("@/app/(protected)/settings/actions");
            const res = await addSenderIdentity(senderName, senderEmail);

            if (res.error) throw new Error(res.error);

            toast({ title: "Sender Added", description: "Verify your domain in Resend to start sending." });
            setStep(s => s + 1);
        } catch (e: any) {
            toast({ title: "Error", description: e.message || "Failed to add sender.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const variants = {
        enter: { opacity: 0, x: 20 },
        center: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-foreground overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[128px] opacity-40" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[128px] opacity-40" />
            </div>

            <div className="w-full max-w-lg p-6 relative z-10">
                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-primary' : 'w-2 bg-muted'}`} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            variants={variants}
                            initial="enter" animate="center" exit="exit"
                            className="text-center space-y-6"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/20 mb-4">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                                Welcome to AutoMail
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Let&apos;s set up your AI automation engine. We&apos;ll connect your tools so you can start generating leads and sending emails in minutes.
                            </p>
                            <Button size="lg" className="w-full h-12 text-base mt-4 shadow-lg shadow-primary/25" onClick={() => setStep(1)}>
                                Set Up My Account <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={variants}
                            initial="enter" animate="center" exit="exit"
                        >
                            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                                <KeyRound className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-xl font-semibold">Connect OpenAI</h2>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            AutoMail uses OpenAI to generate personalized email content and analyze leads.
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>API Key</Label>
                                            <Input
                                                type="password"
                                                placeholder="sk-..."
                                                className="bg-black/20 border-zinc-800 focus:border-primary transition-colors h-11"
                                                value={openaiKey}
                                                onChange={(e) => setOpenaiKey(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Don&apos;t have one? <a href="https://platform.openai.com/api-keys" target="_blank" className="text-primary hover:underline">Get it here</a>
                                            </p>
                                        </div>
                                        <Button
                                            className="w-full h-11"
                                            onClick={() => handleSaveAPIKey('openai', openaiKey)}
                                            disabled={loading || !openaiKey}
                                        >
                                            {loading ? "Connecting..." : "Connect & Continue"}
                                        </Button>
                                        {status?.hasOpenAI && (
                                            <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setStep(2)}>
                                                Generic key detected. Skip step.
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={variants}
                            initial="enter" animate="center" exit="exit"
                        >
                            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-white/10 text-white">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-xl font-semibold">Connect Resend</h2>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Resend is the email delivery infrastructure. It ensures your emails land in the inbox.
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>API Key</Label>
                                            <Input
                                                type="password"
                                                placeholder="re_..."
                                                className="bg-black/20 border-zinc-800 focus:border-primary transition-colors h-11"
                                                value={resendKey}
                                                onChange={(e) => setResendKey(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Create a free account and <a href="https://resend.com/api-keys" target="_blank" className="text-primary hover:underline">get a key here</a>.
                                            </p>
                                        </div>
                                        <Button
                                            className="w-full h-11"
                                            onClick={() => handleSaveAPIKey('resend', resendKey)}
                                            disabled={loading || !resendKey}
                                        >
                                            {loading ? "Connecting..." : "Connect & Continue"}
                                        </Button>
                                        {status?.hasResend && (
                                            <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setStep(3)}>
                                                Key detected. Skip step.
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            variants={variants}
                            initial="enter" animate="center" exit="exit"
                        >
                            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-xl font-semibold">Create Sender Identity</h2>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Who should your emails come from? (e.g. &quot;Matt from AutoMail&quot;)
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Sender Name</Label>
                                            <Input
                                                placeholder="John Doe"
                                                className="bg-black/20 border-zinc-800 h-11"
                                                value={senderName}
                                                onChange={(e) => setSenderName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>From Email</Label>
                                            <Input
                                                placeholder="john@yourdomain.com"
                                                className="bg-black/20 border-zinc-800 h-11"
                                                value={senderEmail}
                                                onChange={(e) => setSenderEmail(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Must match a verified domain in Resend.
                                            </p>
                                        </div>
                                        <Button
                                            className="w-full h-11"
                                            onClick={handleAddSender}
                                            disabled={loading || !senderName || !senderEmail}
                                        >
                                            {loading ? "Adding..." : "Add Identity"}
                                        </Button>
                                        {status?.hasSender && (
                                            <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setStep(4)}>
                                                Identity detected. Skip step.
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            variants={variants}
                            initial="enter" animate="center" exit="exit"
                            className="text-center space-y-6"
                        >
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-500 mb-4 animate-pulse">
                                <Rocket className="w-10 h-10" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                You&apos;re Ready for Takeoff! 🚀
                            </h1>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Your engine is configured. You can now build automations, capture leads, and send AI-powered emails.
                            </p>
                            <Button size="lg" className="w-full h-12 text-base shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 text-white" onClick={() => router.push('/')}>
                                Go to Dashboard
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
