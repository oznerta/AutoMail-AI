'use client'

import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"

export function TopNav() {


    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0 w-[260px]">
                    <Sidebar className="border-r-0" />
                </SheetContent>
            </Sheet>
            <div className="flex-1">
                <span className="font-semibold text-lg">AutoMail AI</span>
            </div>
        </header>
    )
}
