'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Globe, Shield, Cpu, Zap, CheckCircle2, Lock, Terminal } from 'lucide-react';

// --- 3D TILT CARD WRAPPER ---
function TiltCard({ children, className, containerClassName }: { children: React.ReactNode, className?: string, containerClassName?: string }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set(clientX - left - width / 2);
        y.set(clientY - top - height / 2);
    }

    function onMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const rotateX = useTransform(mouseY, [-200, 200], [5, -5]);
    const rotateY = useTransform(mouseX, [-200, 200], [-5, 5]);

    return (
        <motion.div
            className={`relative perspective-1000 ${containerClassName}`}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{ transformStyle: "preserve-3d" }}
        >
            <motion.div
                style={{ rotateX, rotateY }}
                className={`relative h-full w-full transition-shadow duration-500 rounded-3xl border border-white/10 bg-zinc-900/50 overflow-hidden group hover:shadow-[0_0_30px_-5px_rgba(20,184,166,0.3)] ${className}`}
            >
                {/* SCAN LINE EFFECT */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {children}
            </motion.div>
        </motion.div>
    );
}

// --- LIVE TERMINAL COMPONENT ---
function LiveTerminal() {
    const [lines, setLines] = useState<string[]>([
        "> connecting to edge_node_1...",
        "> status: ONLINE (12ms)",
        "> initializing secure handshake..."
    ]);

    useEffect(() => {
        const possibleLines = [
            "> decrypting payload...",
            "> optimizing route...",
            "> cache hit: 98%",
            "> verifying signature...",
            "> dispatching event #84920...",
            "> sync completed.",
            "> packet received: 24kb"
        ];

        const interval = setInterval(() => {
            setLines(prev => {
                const newLine = possibleLines[Math.floor(Math.random() * possibleLines.length)];
                const newLines = [...prev, newLine];
                if (newLines.length > 8) newLines.shift(); // Keep only last 8 lines
                return newLines;
            });
        }, 800);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="font-mono text-[10px] sm:text-xs text-green-400 p-4 h-full flex flex-col justify-end">
            {lines.map((line, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="truncate"
                >
                    {line}
                </motion.div>
            ))}
            <div className="animate-pulse mt-1">_</div>
        </div>
    );
}

// --- AI VISUALIZATION COMPONENT ---
function AIEngine() {
    return (
        <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
            {/* Pulsing Core */}
            <div className="relative">
                <div className="absolute inset-0 bg-primary/50 blur-[50px] animate-pulse"></div>
                <div className="relative z-10 h-24 w-24 rounded-full border border-primary/50 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary/20 animate-ping"></div>
                </div>
                {/* Code Particles emitting */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full"
                        initial={{ opacity: 0, x: 0, y: 0 }}
                        animate={{
                            opacity: [0, 1, 0],
                            x: Math.cos(i * 60 * (Math.PI / 180)) * 100,
                            y: Math.sin(i * 60 * (Math.PI / 180)) * 100
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function BentoGrid() {
    return (
        <section className="py-24 bg-black relative z-10 border-t border-white/5">
            <div className="container px-4 md:px-6 max-w-[1400px]">
                <div className="mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        No fluff. Just <span className="text-zinc-500">shipping</span>.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl text-lg">
                        The email platform for developers who want full control.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">

                    {/* Card 1: AI Engine (Wide) */}
                    <TiltCard containerClassName="md:col-span-2 row-span-1">
                        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
                        <AIEngine />
                        <div className="relative z-10 p-8 h-full flex flex-col">
                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                <Cpu className="h-4 w-4" />
                                <span className="text-xs font-mono uppercase tracking-wider">Neural Engine</span>
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Generative</span> Builder
                            </div>
                            <p className="text-zinc-500 font-mono text-sm mt-auto max-w-md">
                                // GPT-4o Integration <br />
                                // Text-to-HTML generation <br />
                                // Context-aware copywriting
                            </p>
                        </div>
                    </TiltCard>

                    {/* Card 2: Live Trace (Tall) */}
                    <TiltCard containerClassName="md:col-span-1 row-span-1">
                        <div className="flex flex-col h-full bg-black/40">
                            <div className="flex items-center gap-2 text-zinc-400 p-6 pb-2 border-b border-white/5">
                                <Terminal className="h-4 w-4" />
                                <span className="text-xs font-mono uppercase tracking-wider">System Logs</span>
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                <div className="absolute inset-0 bg-green-500/5 animate-pulse pointer-events-none"></div>
                                <LiveTerminal />
                            </div>
                        </div>
                    </TiltCard>

                    {/* Card 3: BYOK (Tall) */}
                    <TiltCard containerClassName="md:col-span-1 row-span-1">
                        <div className="relative z-10 p-8 h-full flex flex-col">
                            <div className="flex items-center gap-2 text-zinc-400 mb-4">
                                <Shield className="h-4 w-4" />
                                <span className="text-xs font-mono uppercase tracking-wider">Data Sovereignty</span>
                            </div>
                            <div className="text-2xl font-bold text-white mb-auto">Bring Your Own Keys</div>

                            <div className="space-y-4 mt-8">
                                <div className="flex items-center gap-3 group">
                                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Lock className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <span className="text-zinc-300 text-sm">Supabase Direct</span>
                                </div>
                                <div className="flex items-center gap-3 group">
                                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <span className="text-zinc-300 text-sm">OpenAI API Key</span>
                                </div>
                            </div>
                        </div>
                    </TiltCard>

                    {/* Card 4: Webhook API (Wide) */}
                    <TiltCard containerClassName="md:col-span-2 row-span-1">
                        <div className="flex flex-col md:flex-row items-center justify-between p-8 h-full relative group">
                            <div className="relative z-10 w-full md:max-w-[40%] mb-6 md:mb-0">
                                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                    <Zap className="h-4 w-4" />
                                    <span className="text-xs font-mono uppercase tracking-wider">Universal API</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Ingest from anywhere.</h3>
                                <p className="text-zinc-500 text-sm">
                                    Trigger sequences via our high-performance Edge API.
                                </p>
                            </div>

                            <div className="bg-black/50 p-5 rounded-lg font-mono text-[10px] md:text-xs border border-white/10 shadow-2xl skew-x-[-2deg] group-hover:skew-x-0 transition-all duration-300 w-full md:w-[55%] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-50"><div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div></div>
                                <div className="text-zinc-500 select-none mb-2">// POST https://automailai.vercel.app/api/ingest</div>
                                <div className="text-purple-400">await <span className="text-yellow-300">fetch</span>(url, {'{'}</div>
                                <div className="pl-4 text-blue-300">method: <span className="text-green-300">'POST'</span>,</div>
                                <div className="pl-4 text-blue-300">headers: {'{'} <span className="text-green-300">'Authorization'</span>: <span className="text-orange-300">'Bearer sk_live_...'</span> {'}'},</div>
                                <div className="pl-4 text-blue-300">body: JSON.stringify({'{'}</div>
                                <div className="pl-8 text-cyan-300">event: <span className="text-green-300">'user.signup'</span>,</div>
                                <div className="pl-8 text-cyan-300">email: <span className="text-green-300">'demo@automail.ai'</span></div>
                                <div className="pl-4 text-blue-300">{'}'})</div>
                                <div className="text-purple-400">{'}'})</div>
                            </div>
                        </div>
                    </TiltCard>

                </div>
            </div>
        </section>
    );
}
