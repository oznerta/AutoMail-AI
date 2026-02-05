"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export interface DocsSidebarNavProps {
    items: SidebarNavItem[]
}

export interface SidebarNavItem {
    title: string
    items: {
        title: string
        href: string
        disabled?: boolean
    }[]
}

export function DocsSidebarNav({ items }: DocsSidebarNavProps) {
    const pathname = usePathname()

    return items.length ? (
        <div className="w-full pb-20">
            {items.map((item, index) => (
                <div key={index} className="pb-8">
                    <h4 className="mb-2 rounded-md px-2 py-1 text-sm font-bold tracking-wider text-foreground/90 uppercase text-[11px] opacity-70">
                        {item.title}
                    </h4>
                    {item?.items?.length && (
                        <div className="grid grid-flow-row auto-rows-max text-sm space-y-1">
                            {item.items.map((child, i) => (
                                <Link
                                    key={i}
                                    href={child.href}
                                    className={cn(
                                        "group flex w-full items-center rounded-md border border-transparent px-3 py-2 hover:bg-muted/50 hover:text-foreground transition-all duration-200",
                                        pathname === child.href
                                            ? "font-medium text-primary bg-primary/10 border-primary/20"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {child.title}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    ) : null
}
