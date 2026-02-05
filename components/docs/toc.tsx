"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TocItem {
    title: string
    url: string
    items?: TocItem[] // For nested h3 support
}

interface DocsTocProps {
    items?: TocItem[]
}

// Stub for now, can be hydrated by reading headings later if we implement MDX
export function DocsToc({ items = [] }: DocsTocProps) {
    if (items.length === 0) {
        // Fallback static items just for visual structure if none passed
        // In a real app we'd parse the 'children' or use a remark plugin output
        return (
            <div className="space-y-2">
                <p className="font-medium text-sm">On this page</p>
                <ul className="m-0 list-none text-sm text-muted-foreground space-y-2">
                    <li>
                        <a href="#" className="hover:text-foreground transition-colors">Overview</a>
                    </li>
                </ul>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <p className="font-medium text-sm">On this page</p>
            <ul className="m-0 list-none">
                {items.map((item, index) => (
                    <li key={index} className="mt-0 pt-2">
                        <a
                            href={item.url}
                            className={cn(
                                "inline-block no-underline transition-colors hover:text-foreground text-sm text-muted-foreground",
                                item.url === "#overview" && "font-medium text-foreground" // Demo active state
                            )}
                        >
                            {item.title}
                        </a>
                        {item.items?.length ? (
                            <ul className="m-0 list-none pl-4">
                                {item.items.map((subItem, subIndex) => (
                                    <li key={subIndex} className="mt-0 pt-2">
                                        <a
                                            href={subItem.url}
                                            className="inline-block no-underline transition-colors hover:text-foreground text-sm text-muted-foreground"
                                        >
                                            {subItem.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    )
}
