'use client';

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

interface OnboardingLayoutProps {
    children: ReactNode;
    className?: string;
    step?: number;
    totalSteps?: number;
}

export function OnboardingLayout({ children, className, step, totalSteps }: OnboardingLayoutProps) {
    return (
        <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse delay-700" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                    "relative z-10 w-full max-w-4xl bg-zinc-950/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row",
                    className
                )}
            >
                {/* Visual Side (Hidden on Mobile) */}
                <div className="hidden md:flex flex-col justify-between w-1/3 min-w-[280px] bg-zinc-900/50 p-8 border-r border-white/5 relative overflow-hidden">
                    {/* Progress Indicator */}
                    {step && totalSteps && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${(step / totalSteps) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    )}

                    <div className="z-10 mt-8">
                        <div className="mb-6">
                            <Logo showText={true} href="#" className="pointer-events-none" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                            Setup your workspace
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Let's get the boring stuff out of the way so you can start sending smart emails.
                        </p>
                    </div>

                    <div className="z-10 space-y-4">
                        {/* Step List could go here */}
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((s) => (
                                <div key={s} className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-6 w-6 rounded-full flex items-center justify-center text-xs border",
                                        step && step >= s
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "bg-transparent border-zinc-700 text-zinc-500"
                                    )}>
                                        {step && step > s ? "✓" : s}
                                    </div>
                                    <span className={cn(
                                        "text-sm font-medium",
                                        step === s ? "text-white" : "text-zinc-500"
                                    )}>
                                        {s === 1 && "Welcome"}
                                        {s === 2 && "Import Data"}
                                        {s === 3 && "Integrations"}
                                        {s === 4 && "Sender Info"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Decorative Blob */}
                    <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-primary/30 blur-[60px] rounded-full" />
                </div>

                {/* Content Side */}
                <div className="flex-1 p-6 md:p-12 overflow-y-auto max-h-[85vh] md:max-h-auto relative">
                    {/* Mobile Logo */}
                    <div className="md:hidden flex items-center justify-between mb-8">
                        <Logo showText={true} href="#" className="pointer-events-none scale-90 origin-left" />
                        {step && totalSteps && (
                            <div className="text-xs text-muted-foreground">
                                Step {step} of {totalSteps}
                            </div>
                        )}
                    </div>

                    {children}
                </div>
            </motion.div>
        </div>
    );
}
