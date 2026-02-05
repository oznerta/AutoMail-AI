"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, Mail, Shield, Zap, ArrowRight, CheckCircle2, Send, Cpu, Globe, Lock } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import BentoGrid from "@/components/landing/BentoGrid";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import React, { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FloatingNav } from "@/components/landing/floating-nav";
import { ApiPlayground } from "@/components/docs/api-playground";

const ThreeScene = dynamic(() => import("@/components/landing/ThreeScene"), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-background" />,
});

function ParallaxItem({ children, className, speed = 1 }: { children: React.ReactNode, className?: string, speed?: number }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);

    // Disable parallax on mobile via CSS/Media Query unlikely in framer motion direct value? 
    // We can conditionally apply style. 
    // Using a simple window width check in useEffect or useMediaQuery.
    const [isMobile, setIsMobile] = useState(true); // Default to true to prevent hydration mismatch with "squashed" 

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <motion.div ref={ref} style={isMobile ? {} : { y }} className={className}>
            {children}
        </motion.div>
    );
}

function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden transition-colors hover:bg-zinc-900/80 ${className}`}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-10"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(20,184,166,0.1), transparent 40%)`,
                }}
            />
            <div className="relative z-0 h-full">{children}</div>
        </div>
    );
}

// Animated Curved Path Component
function JourneyPath() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start center", "end end"]
    });

    const pathLength = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div ref={ref} className="absolute left-0 top-0 bottom-0 w-full pointer-events-none hidden md:block">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Background Track - Increased opacity for visibility */}
                <path
                    d="M 50,0 C 50,20 20,20 20,35 C 20,50 80,50 80,65 C 80,80 20,80 20,100"
                    fill="none"
                    strokeWidth="0.5"
                    stroke="rgba(255,255,255,0.15)"
                />

                {/* Active Glowing Beam - White Core for Max Contrast */}
                <motion.path
                    d="M 50,0 C 50,20 20,20 20,35 C 20,50 80,50 80,65 C 80,80 20,80 20,100"
                    fill="none"
                    strokeWidth="1.5"
                    stroke="#ffffff" // White Core
                    strokeLinecap="round"
                    style={{ pathLength }}
                />

                {/* Glow Effect Layer - Cyan Aura */}
                <motion.path
                    d="M 50,0 C 50,20 20,20 20,35 C 20,50 80,50 80,65 C 80,80 20,80 20,100"
                    fill="none"
                    strokeWidth="6"
                    stroke="#22d3ee" // Cyan Glow
                    strokeOpacity="0.4"
                    strokeLinecap="round"
                    style={{ pathLength }}
                    className="blur-md"
                />
            </svg>
        </div>
    );
}

export default function LandingPage() {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

    return (
        <div className="flex min-h-screen flex-col bg-background overflow-x-hidden selection:bg-primary/30 selection:text-primary-foreground">
            {/* HUD Elements - Tech Decoration */}
            <div className="absolute top-24 left-10 hidden lg:block opacity-30 font-mono text-xs text-primary z-40 pointer-events-none select-none tracking-widest">
                <div className="mb-2">SYS.STATUS: ONLINE</div>
                <div className="mb-2">KERNEL: v4.19.2</div>
                <div>MEM: 64TB OK</div>
            </div>
            <div className="absolute top-24 right-10 hidden lg:block opacity-30 font-mono text-xs text-primary z-40 pointer-events-none select-none text-right tracking-widest">
                <div className="mb-2">LATENCY: 12ms</div>
                <div className="mb-2">REGION: US-EAST-1</div>
                <div>ENCRYPTION: AES-256</div>
            </div>

            {/* 3D Background Layer */}
            <div className="fixed inset-0 z-0 h-screen w-full">
                <ThreeScene />
            </div>

            {/* Awwwards-style Floating Dock Navigation (Desktop) & Top Bar (Mobile) */}
            <FloatingNav />

            <main className="relative z-10 flex-1">
                {/* Hero Section */}
                <section ref={targetRef} className="relative h-[110vh] flex flex-col items-center justify-center pt-20">
                    <motion.div
                        style={{ opacity, scale }}
                        className="container px-4 md:px-6 relative z-10 text-center flex flex-col items-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8 backdrop-blur-md"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                            Public Beta Available
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="text-[2.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[9rem] font-black tracking-tighter leading-[0.9] mb-6 whitespace-nowrap"
                        >
                            <span className="text-white drop-shadow-2xl relative inline-block group">
                                AUTOMAIL
                                <span className="absolute top-0 left-0 -ml-[2px] text-red-500 opacity-0 group-hover:opacity-50 animate-pulse">AUTOMAIL</span>
                                <span className="absolute top-0 left-0 ml-[2px] text-cyan-500 opacity-0 group-hover:opacity-50 animate-pulse delay-75">AUTOMAIL</span>
                            </span>{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-primary to-teal-400 filter drop-shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                                AI
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="max-w-[800px] text-lg md:text-2xl text-muted-foreground font-light mb-12 leading-relaxed"
                        >
                            <span className="text-white font-medium text-2xl md:text-3xl block mb-4">Intelligent Email Infrastructure</span>
                            The developer-first platform for high-performance automation. <br className="hidden md:block" />
                            Visual builders, deterministic workflows, and <span className="text-white font-medium">total data sovereignty</span>.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-6"
                        >
                            <Link href="/signup">
                                <Button size="lg" className="h-14 px-10 text-xl rounded-full bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)] transition-all hover:scale-105">
                                    Start Building
                                    <ArrowRight className="ml-2 h-6 w-6" />
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </section>

                {/* Marquee Section */}
                <div className="w-full py-12 border-y border-white/5 bg-background/50 backdrop-blur-sm overflow-hidden whitespace-nowrap">
                    <div className="inline-block animate-marquee">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className="mx-12 text-2xl font-bold text-white/10 uppercase tracking-widest">
                                POWERED BY OPENAI • SECURED BY SUPABASE • EMAIL BY RESEND •
                            </span>
                        ))}
                    </div>
                </div>

                {/* The Journey Section - Structured as a timeline/story */}
                <section id="features" className="py-32 relative bg-zinc-950 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-30"></div>

                    {/* Scroll Tracker - Weaving Line */}
                    <JourneyPath />

                    <div className="container px-4 md:px-6 max-w-[1400px] relative z-10">

                        {/* 01. DESIGN */}
                        <div className="min-h-[60vh] flex flex-col md:flex-row items-center gap-16 md:gap-32 mb-32">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: false, margin: "-100px" }}
                                transition={{ duration: 0.8 }}
                                className="md:w-1/2"
                            >
                                <span className="text-primary font-mono text-xl mb-4 block">01 / DESIGN</span>
                                <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
                                    Visuals that <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">adapt to context.</span>
                                </h2>
                                <p className="text-xl text-zinc-400 leading-relaxed mb-8">
                                    Forget rigid templates. Use our <strong>Neural Builder</strong> to generate responsive HTML emails from simple prompts. Edit the code directly or let AI match your brand voice perfectly.
                                </p>
                                <ul className="space-y-4">
                                    {['GPT-4o Integration', 'Tailwind-ready HTML', 'Dark Mode support'].map(item => (
                                        <li key={item} className="flex items-center text-zinc-300">
                                            <CheckCircle2 className="h-5 w-5 mr-3 text-primary" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                            <ParallaxItem speed={0.5} className="w-full md:w-1/2 relative">
                                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full"></div>
                                <SpotlightCard className="border border-white/10 p-6 shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-500">
                                    <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                        <div className="ml-auto text-xs text-zinc-500">Editor Preview</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse"></div>
                                        <div className="h-4 w-1/2 bg-zinc-800 rounded animate-pulse"></div>
                                        <div className="h-32 w-full bg-zinc-800/50 rounded mt-4 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-xs md:text-base text-center p-2">
                                            AI Generating Design...
                                        </div>
                                    </div>
                                </SpotlightCard>
                            </ParallaxItem>
                        </div>

                        {/* 02. AUTOMATE */}
                        <div className="min-h-[60vh] flex flex-col md:flex-row-reverse items-center gap-16 md:gap-32 mb-32">
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: false, margin: "-100px" }}
                                transition={{ duration: 0.8 }}
                                className="md:w-1/2"
                            >
                                <span className="text-primary font-mono text-xl mb-4 block">02 / AUTOMATE</span>
                                <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
                                    Logic that <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">actually listens.</span>
                                </h2>
                                <p className="text-xl text-zinc-400 leading-relaxed mb-8">
                                    Build multi-step workflows that react to real-time events. Tag users, delay sequences, and trigger webhooks without writing a single cron job line.
                                </p>
                                <ul className="space-y-4">
                                    {['Visual Sequence Builder', 'Webhook Triggers', 'Conditional Branching'].map(item => (
                                        <li key={item} className="flex items-center text-zinc-300">
                                            <Zap className="h-5 w-5 mr-3 text-yellow-500" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                            <ParallaxItem speed={-0.3} className="w-full md:w-1/2">
                                <div className="grid grid-cols-2 gap-4">
                                    <SpotlightCard className="border border-white/10 p-6 rounded-2xl">
                                        <Bot className="h-8 w-8 text-white mb-4" />
                                        <div className="font-mono text-xs text-primary mb-1">TRIGGER</div>
                                        <div className="font-bold">User Signed Up</div>
                                    </SpotlightCard>
                                    <SpotlightCard className="border border-white/10 p-6 rounded-2xl translate-y-8 opacity-50">
                                        <Mail className="h-8 w-8 text-white mb-4" />
                                        <div className="font-mono text-xs text-primary mb-1">ACTION</div>
                                        <div className="font-bold">Send Welcome</div>
                                    </SpotlightCard>
                                </div>
                            </ParallaxItem>
                        </div>

                        {/* 03. SCALE */}
                        <div id="api" className="min-h-[60vh] flex flex-col md:flex-row items-center gap-16 md:gap-32">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: false, margin: "-100px" }}
                                transition={{ duration: 0.8 }}
                                className="md:w-1/2"
                            >
                                <span className="text-primary font-mono text-xl mb-4 block">03 / SCALE</span>
                                <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
                                    Data that <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">flows securely.</span>
                                </h2>
                                <p className="text-xl text-zinc-400 leading-relaxed mb-8">
                                    Your data, your keys. We act as the logic layer while you retain full control over your SMTP reputation and customer data. We never train generative models on your private lists.
                                </p>
                                <Link href="/docs">
                                    <Button variant="outline" className="h-12 px-8 rounded-full border-white/20 hover:bg-white hover:text-black">
                                        Read the Architecture Docs
                                    </Button>
                                </Link>
                            </motion.div>
                            <ParallaxItem speed={0.4} className="w-full md:w-1/2">
                                <ApiPlayground />
                            </ParallaxItem>
                        </div>

                    </div>
                </section>

                <BentoGrid />

                {/* CTA */}
                <section className="py-32 flex justify-center items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 blur-[100px]"></div>
                    <div className="text-center relative z-10">
                        <h2 className="text-5xl md:text-8xl font-black mb-10 tracking-tighter">
                            Ready to launch?
                        </h2>
                        <Link href="/signup">
                            <Button size="lg" className="h-16 px-12 text-2xl rounded-full bg-primary text-primary-foreground hover:scale-110 transition-transform duration-500 shadow-[0_0_50px_-10px_var(--primary)]">
                                Start Building
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* HUGE FOOTER */}
                <footer className="relative bg-black text-white py-24 md:py-32 overflow-hidden">
                    <div className="container px-4 md:px-6 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-24">
                            <div className="md:col-span-5">
                                <Logo className="scale-125 origin-left mb-8" />
                                <p className="text-xl text-zinc-400 max-w-md leading-relaxed">
                                    The infrastructure for modern email automation.
                                    Built for developers who demand control, speed, and privacy.
                                </p>
                            </div>

                            <div className="md:col-span-2 md:col-start-7">
                                <h4 className="font-bold text-lg mb-6">Product</h4>
                                <ul className="space-y-4 text-zinc-400">
                                    <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
                                    <li><Link href="/docs/api/overview" className="hover:text-primary transition-colors">API</Link></li>
                                    <li><Link href="/changelog" className="hover:text-primary transition-colors">Changelog</Link></li>
                                </ul>
                            </div>

                            <div className="md:col-span-2">
                                <h4 className="font-bold text-lg mb-6">Resources</h4>
                                <ul className="space-y-4 text-zinc-400">
                                    <li><Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
                                    <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                                    <li><Link href="/community" className="hover:text-primary transition-colors">Community</Link></li>
                                    <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
                                </ul>
                            </div>

                            <div className="md:col-span-2">
                                <h4 className="font-bold text-lg mb-6">Legal</h4>
                                <ul className="space-y-4 text-zinc-400">
                                    <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
                                    <li><Link href="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
                                    <li><Link href="/security" className="hover:text-primary transition-colors">Security</Link></li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-end border-t border-white/10 pt-12">
                            <p className="text-zinc-600 mb-4 md:mb-0">© 2026 AutoMail AI Inc.</p>

                            {/* Huge Watermark */}
                            <h1 className="text-[12vw] leading-none font-black tracking-tighter text-zinc-900 pointer-events-none select-none absolute -bottom-10 right-0 opacity-50">
                                AUTOMAIL
                            </h1>
                        </div>
                    </div>
                </footer>
            </main>

            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </div>
    );
}
