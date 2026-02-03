import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    showText?: boolean;
    href?: string;
}

export function Logo({ className, showText = true, href = "/dashboard" }: LogoProps) {
    return (
        <Link href={href} className={cn("flex items-center gap-2 transition-opacity hover:opacity-90", className)}>
            <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-primary/10">
                {/* Dynamic SVG Logo using 'text-primary' */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    <path d="M12 22v-6" />
                    <path d="M8 22h8" />
                </svg>
            </div>
            {showText && (
                <span className="font-bold text-xl tracking-tight text-foreground">
                    AutoMail <span className="text-primary">AI</span>
                </span>
            )}
        </Link>
    );
}
