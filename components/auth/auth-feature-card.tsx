"use client";

import { motion } from "framer-motion";
import { Zap, FileCode, Send, Terminal, CheckCircle2, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthFeatureCard() {
    return (
        <div className="w-full max-w-sm relative group">
            {/* Simple Ambient Glow - Monochrome Teal only */}
            <div className="absolute -inset-0.5 bg-teal-900/20 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition duration-1000"></div>

            {/* Main Card Container - Darker, cleaner industrial look */}
            <div className="relative overflow-hidden rounded-xl bg-[#09090b] border border-zinc-800 p-5 shadow-2xl">

                {/* Tech Decoration: Corner brackets (Subtle) */}
                <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-zinc-800 rounded-tl-sm"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-zinc-800 rounded-tr-sm"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-zinc-800 rounded-bl-sm"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-zinc-800 rounded-br-sm"></div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 border-b border-zinc-900 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                            <span className="text-xs font-mono text-zinc-400 tracking-tight">AUTOMATION_LOGS</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600">ID: flow_v92</span>
                    </div>

                    {/* Workflow Visualization */}
                    <div className="space-y-5 relative pl-2">
                        {/* Connecting Line */}
                        <div className="absolute left-[21px] top-4 bottom-4 w-px bg-zinc-900" />

                        {/* Step 1: Trigger (Generic) */}
                        <motion.div
                            className="relative flex items-center gap-4"
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="relative z-10 h-10 w-10 rounded-md bg-[#09090b] border border-zinc-800 flex items-center justify-center">
                                <Zap className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-zinc-300 font-mono">Automation Triggered</span>
                                    <span className="text-[10px] text-zinc-600 font-mono">source: event_listener</span>
                                </div>
                                <div className="mt-1.5 h-1 w-full bg-zinc-900/50 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-zinc-700"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 0.5, delay: 0.4 }}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 2: Render (Template) */}
                        <motion.div
                            className="relative flex items-center gap-4"
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.0 }}
                        >
                            <div className="relative z-10 h-10 w-10 rounded-md bg-[#09090b] border border-teal-900/30 flex items-center justify-center shadow-[0_0_15px_-5px_rgba(20,184,166,0.1)]">
                                <LayoutTemplate className="h-4 w-4 text-teal-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-teal-100/90 font-mono">Rendering Template</span>
                                </div>
                                <div className="mt-1.5 flex items-center gap-2 p-1.5 bg-zinc-900/30 rounded border border-zinc-900/50">
                                    <span className="text-[10px] text-zinc-500 font-mono">load: "onboarding_v1"</span>
                                    <span className="text-[10px] text-zinc-600 font-mono">→</span>
                                    <span className="text-[10px] text-teal-400/80 font-mono">1.4ms</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 3: Action (Send) */}
                        <motion.div
                            className="relative flex items-center gap-4"
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.8 }}
                        >
                            <div className="relative z-10 h-10 w-10 rounded-md bg-[#09090b] border border-zinc-800 flex items-center justify-center">
                                <Send className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div className="flex-1 flex justify-between items-center">
                                <span className="text-xs font-medium text-zinc-300 font-mono">Email Dispatched</span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-950/30 border border-teal-900/30">
                                    <CheckCircle2 className="h-3 w-3 text-teal-600" />
                                    <span className="text-[9px] font-bold text-teal-600 uppercase tracking-wider">Sent</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Terminal Footer (Minimal) */}
                    <div className="mt-6 pt-4 border-t border-zinc-900">
                        <div className="font-mono text-[10px] text-zinc-500 flex items-center gap-2">
                            <Terminal className="h-3 w-3" />
                            <span className="opacity-40">worker-01:</span>
                            <span className="text-zinc-500">job completed in 84ms</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
