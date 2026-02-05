"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Github } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

export function FloatingNav() {
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { name: 'Features', href: '/#features' },
        { name: 'API', href: '/#api' },
        { name: 'Docs', href: '/docs' }
    ];

    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 md:top-6 left-0 right-0 z-50 flex justify-center md:px-4"
        >
            <div className="flex w-full md:w-auto items-center justify-between md:justify-start gap-1 p-3 md:p-2 border-b md:border md:rounded-full border-white/10 bg-black/40 backdrop-blur-xl shadow-lg md:shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] md:ring-1 ring-white/5">

                {/* Logo Segment */}
                <div className="pl-2 md:pl-4 pr-6 md:border-r border-white/5 shrink-0">
                    <Logo />
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center px-2">
                    {navLinks.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="px-5 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-all duration-300 hover:bg-white/5 rounded-full relative group"
                        >
                            {item.name}
                            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        </Link>
                    ))}
                </nav>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-2 md:border-l border-white/5 pl-2 pr-2">
                    <Link href="/login">
                        <Button variant="ghost" className="rounded-full hover:bg-white/5 text-zinc-300 text-sm">
                            Login
                        </Button>
                    </Link>
                    <Link href="/signup">
                        <Button className="rounded-full px-6 bg-white text-black hover:bg-primary hover:text-white transition-all duration-300 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] text-sm h-10">
                            Get Started
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Toggle - Visible only on small screens */}
                <div className="flex md:hidden ml-auto items-center gap-2 pr-2">
                    <Link href="/login">
                        <Button variant="ghost" size="sm" className="rounded-full text-zinc-400">
                            Log in
                        </Button>
                    </Link>

                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="rounded-full bg-white/5 border-white/10 text-white">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="top" hideDefaultClose className="w-full h-full bg-black/95 backdrop-blur-2xl border-b border-white/10 p-0">
                            <div className="flex flex-col h-full relative overflow-hidden">
                                {/* Mobile Menu Header */}
                                <div className="absolute top-0 left-0 right-0 p-4 border-b border-white/5 flex items-center justify-between z-10 bg-black/50">
                                    <div className="pl-2" onClick={() => setIsOpen(false)}>
                                        <Logo />
                                    </div>
                                    <SheetClose asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-white hover:bg-white/10">
                                            <X className="h-6 w-6" />
                                        </Button>
                                    </SheetClose>
                                </div>

                                {/* Mobile Links */}
                                <div className="flex-1 flex flex-col justify-center items-center gap-8 p-8 relative z-0">
                                    {/* Background Decor */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full opacity-50 pointer-events-none" />

                                    {navLinks.map((item, idx) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 hover:to-white transition-all transform hover:scale-105"
                                        >
                                            {item.name}
                                        </Link>
                                    ))}

                                    <div className="h-px w-24 bg-white/10 my-4" />

                                    <div className="flex flex-col gap-4 w-full max-w-xs">
                                        <Link href="/signup" onClick={() => setIsOpen(false)}>
                                            <Button className="w-full h-14 rounded-full text-lg shadow-[0_0_30px_-5px_rgba(20,184,166,0.3)] hover:shadow-[0_0_50px_-10px_rgba(20,184,166,0.5)] transition-all bg-primary text-black hover:bg-primary/90">
                                                Get Started <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </Link>
                                        <Link href="/login" onClick={() => setIsOpen(false)}>
                                            <Button variant="outline" className="w-full h-14 rounded-full text-lg border-white/20 bg-transparent text-white hover:bg-white/10">
                                                Sign In
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </motion.header>
    );
}
