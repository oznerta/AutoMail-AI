"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { useState } from "react"

interface DocsLayoutProps {
    children: React.ReactNode
}

function DocsSidebar({ className, setIsOpen }: { className?: string, setIsOpen?: (open: boolean) => void }) {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;
    const close = () => setIsOpen && setIsOpen(false);

    return (
        <ScrollArea className={cn("h-full py-6 pr-6 lg:py-8", className)}>
            <div className="w-full pl-6">
                <h4 className="mb-4 text-sm font-semibold">Getting Started</h4>
                <div className="grid grid-flow-row auto-rows-max text-sm gap-2">
                    <Link href="/docs" onClick={close} className={cn("flex w-full items-center rounded-md p-2 hover:underline", isActive("/docs") ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground")}>
                        Introduction
                    </Link>
                </div>

                <h4 className="mt-6 mb-4 text-sm font-semibold">API Reference</h4>
                <div className="grid grid-flow-row auto-rows-max text-sm gap-2">
                    <Link href="/docs/api/overview" onClick={close} className={cn("flex w-full items-center rounded-md p-2 hover:underline", isActive("/docs/api/overview") ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground")}>
                        Overview & Auth
                    </Link>
                    <Link href="/docs/api/ingest" onClick={close} className={cn("flex w-full items-center rounded-md p-2 hover:underline", isActive("/docs/api/ingest") ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground")}>
                        Ingest API
                    </Link>
                    <Link href="/docs/api/webhooks" onClick={close} className={cn("flex w-full items-center rounded-md p-2 hover:underline", isActive("/docs/api/webhooks") ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground")}>
                        Automation Webhooks
                    </Link>
                </div>

                <h4 className="mt-6 mb-4 text-sm font-semibold">Guides</h4>
                <div className="grid grid-flow-row auto-rows-max text-sm gap-2">
                    <Link href="/docs/guides/first-automation" onClick={close} className={cn("flex w-full items-center rounded-md p-2 hover:underline", isActive("/docs/guides/first-automation") ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground")}>
                        First Automation
                    </Link>
                    <Link href="/docs/guides/email-setup" onClick={close} className={cn("flex w-full items-center rounded-md p-2 hover:underline", isActive("/docs/guides/email-setup") ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground")}>
                        Email Setup
                    </Link>
                </div>
            </div>
        </ScrollArea>
    )
}

export default function DocsLayout({ children }: DocsLayoutProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex flex-col md:flex-row h-full w-full">
            {/* Mobile Sidebar Trigger */}
            <div className="md:hidden border-b p-4 flex items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 w-full">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="mr-2">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64 pt-10">
                        <DocsSidebar setIsOpen={setIsOpen} />
                    </SheetContent>
                </Sheet>
                <span className="font-semibold">Documentation</span>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 border-r bg-muted/10 shrink-0 h-full overflow-y-auto sticky top-0">
                <DocsSidebar />
            </aside>

            {/* Main Content */}
            <main className="flex-1 w-full overflow-y-auto">
                <div className="container max-w-5xl py-6 lg:py-10 px-4 md:px-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
