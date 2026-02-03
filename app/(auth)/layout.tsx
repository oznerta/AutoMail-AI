import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Link
                href="/"
                className="absolute left-4 top-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground md:left-8 md:top-8"
            >
                <ChevronLeft className="h-4 w-4" />
                Back to Home
            </Link>
            <div className="w-full max-w-sm space-y-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <Logo href="/" className="scale-125" />
                </div>
                {children}
            </div>
        </div>
    );
}
