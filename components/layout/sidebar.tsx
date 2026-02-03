"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, Home, LayoutDashboard, Settings, Users, Workflow, CircleUser, LogOut, Database } from "lucide-react"
import { Logo } from "@/components/ui/logo"
// Dropdown imports removed

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            label: "Contacts",
            icon: Users,
            href: "/contacts",
            active: pathname === "/contacts",
        },
        {
            label: "Email Templates",
            icon: Bot,
            href: "/email-builder",
            active: pathname === "/email-builder" || pathname.startsWith("/email-builder/"),
        },
        {
            label: "Automations",
            icon: Workflow,
            href: "/automations",
            active: pathname === "/automations",
        },
        {
            label: "Fields & Tags",
            icon: Database,
            href: "/data",
            active: pathname.startsWith("/data"),
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/settings",
            active: pathname.startsWith("/settings"),
        },
    ]

    const handleLogout = async () => {
        const { signOut } = await import("@/utils/supabase/auth")
        await signOut()
        window.location.href = "/login"
    }

    return (
        <div className={cn("pb-12 flex flex-col h-full", className)}>
            <div className="space-y-4 py-4 flex-1">
                <div className="px-3 py-2">
                    <Logo className="pl-3 mb-14" />
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className="mr-2 h-4 w-4" />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            {/* User Profile Section at Bottom */}
            <div className="mt-auto px-4 pb-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
