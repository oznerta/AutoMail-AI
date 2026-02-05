"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface TechCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
}

export function TechCard({ children, className, title, subtitle }: TechCardProps) {
    return (
        <div className={cn("relative group", className)}>
            {/* Glowing Backdrop */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>

            {/* Main Card */}
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl p-8 overflow-hidden">

                {/* Tech Decoration: Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-teal-500/30 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-teal-500/30 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-teal-500/30 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-teal-500/30 rounded-br-lg"></div>

                {/* HUD Header */}
                <div className="flex justify-between items-center mb-8 border-b border-zinc-800/50 pb-4">
                    <div className="flex flex-col">
                        {title && <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">{title}</h1>}
                        {subtitle && <p className="text-xs text-teal-500/70 font-mono tracking-wider mt-1">{subtitle}</p>}
                    </div>
                    {/* Status Indicator */}
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">SECURE</span>
                    </div>
                </div>

                {children}

                {/* Tech Decoration: Scanline effect overlay (very subtle) */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-5"></div>
            </div>
        </div>
    );
}
