import Link from "next/link";
import { Link as LogOut, Menu } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocsSidebarNav } from "@/components/docs/sidebar-nav";
import { DocsToc } from "@/components/docs/toc";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DocsLayoutProps {
    children: React.ReactNode;
}

const docsConfig = {
    sidebarNav: [
        {
            title: "Getting Started",
            items: [
                { title: "Introduction", href: "/docs" },
                { title: "Quick Start", href: "/docs/guides/quick-start" },
            ],
        },
        {
            title: "Core Platform",
            items: [
                { title: "Contacts & Data", href: "/docs/guides/contacts" },
                { title: "Email Builder", href: "/docs/guides/email-builder" },
                { title: "Automations", href: "/docs/guides/automations" },
                { title: "Campaigns", href: "/docs/guides/campaigns" },
            ],
        },
        {
            title: "API Reference",
            items: [
                { title: "Authorization", href: "/docs/api/overview" },
                { title: "Ingest API", href: "/docs/api/ingest" },
                { title: "Webhooks", href: "/docs/api/webhooks" },
                { title: "Playground", href: "/docs/api/playground" },
            ],
        },
    ],
};

export default function DocsLayout({ children }: DocsLayoutProps) {
    return (
        <div className="flex flex-col min-h-screen relative">
            {/* Subtle Ambient Background - No Grid */}
            <div className="absolute inset-0 z-[-1] h-full w-full bg-background">
                <div className="absolute top-0 right-0 -z-10 opacity-20 transform translate-x-1/3 -translate-y-1/3 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute top-0 left-0 -z-10 opacity-10 transform -translate-x-1/3 -translate-y-1/3 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
            </div>

            {/* Sticky Header with Glassmorphism */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <div className="mr-4 hidden md:flex">
                        <Logo />
                        <span className="ml-3 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-primary border border-primary/20 uppercase">
                            Docs
                        </span>
                    </div>
                    <div className="md:hidden flex mr-2 items-center gap-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="mr-2">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle Menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="pr-0">
                                <Link href="/" className="flex items-center space-x-2 pl-1 mb-8">
                                    <Logo />
                                </Link>
                                <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-1">
                                    <DocsSidebarNav items={docsConfig.sidebarNav} />
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                        <Logo showText={false} />
                    </div>

                    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                        <nav className="flex items-center gap-4">
                            <div className="hidden md:flex gap-4 text-sm font-medium text-muted-foreground">
                                <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
                                <Link href="#" className="transition-colors hover:text-foreground">Support</Link>
                            </div>
                            <div className="flex items-center gap-2 border-l pl-4 ml-2">
                                <Link href="/login">
                                    <Button variant="ghost" size="sm" className="h-8">Login</Button>
                                </Link>
                                <Link href="/signup">
                                    <Button size="sm" className="h-8">Get Started</Button>
                                </Link>
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
                {/* Fixed Sidebar */}
                <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
                    <ScrollArea className="h-full py-6 pr-6 lg:py-8">
                        <DocsSidebarNav items={docsConfig.sidebarNav} />
                    </ScrollArea>
                </aside>

                {/* Main Content Area */}
                <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
                    <div className="mx-auto w-full min-w-0">
                        <div className="mb-4 text-sm text-muted-foreground hidden md:block">
                            Docs <span className="mx-1">/</span> Guide
                        </div>

                        {children}
                    </div>

                    {/* Right Rail Table of Contents */}
                    <div className="hidden text-sm xl:block">
                        <div className="sticky top-16 -mt-10 pt-4">
                            <ScrollArea className="pb-10">
                                <div className="space-y-4 border-l border-zinc-200 dark:border-zinc-800 pl-6 py-2">
                                    <DocsToc />
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
