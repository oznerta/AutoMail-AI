"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { createAutomation } from "./actions"
import { useToast } from "@/components/ui/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CreateAutomationButton() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleCreate = async () => {
        if (!name.trim()) return

        setIsLoading(true)
        try {
            const result = await createAutomation(name)
            if (result.error) {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive"
                })
            } else if (result.success && result.id) {
                toast({
                    title: "Success",
                    description: "Automation created successfully"
                })
                setOpen(false)
                router.push(`/automations/${result.id}`)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="contents">
                    <Button size="sm" className="gap-1 hidden sm:flex">
                        <Plus className="h-3.5 w-3.5" />
                        <span className="whitespace-nowrap">New Workflow</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-6 gap-4 border-dashed bg-muted/20 hover:bg-muted/40 sm:hidden">
                        <div className="p-4 rounded-full bg-background border shadow-sm">
                            <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <div className="font-semibold text-lg">Create New</div>
                        </div>
                    </Button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Automation</DialogTitle>
                    <DialogDescription>
                        Give your new automation workflow a name.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g., Welcome Series"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
