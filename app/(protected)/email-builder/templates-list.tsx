"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Plus, MoreHorizontal, Pencil, Trash2, FileCode, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTemplate, deleteTemplate } from "./actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface Template {
    id: string
    name: string
    updated_at: string
    content?: string // Add content for preview
}

export function TemplatesList({ templates }: { templates: Template[] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newTemplateName, setNewTemplateName] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    // Delete state
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const { toast } = useToast()
    const router = useRouter()

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)

        try {
            // @ts-ignore - Action type mismatch workaround
            const result = await createTemplate(newTemplateName)

            // Check if result has error property (it might be undefined if redirected)
            if (result && result.error) {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive"
                })
            } else {
                // If we get here, it either redirected (so this might not run) 
                // or returned successfully.
                setIsCreateOpen(false)
                setNewTemplateName("")
            }
        } catch (error: any) {
            // Next.js redirects throw errors, we must ignore them
            if (error.digest?.startsWith('NEXT_REDIRECT')) {
                throw error
            }
            toast({
                title: "Error",
                description: "Failed to create template. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsCreating(false)
        }
    }

    const confirmDelete = async () => {
        if (!templateToDelete) return
        setIsDeleting(true)

        try {
            const result = await deleteTemplate(templateToDelete)
            if (result.success) {
                toast({
                    title: "Template deleted",
                    description: "The template has been permanently removed.",
                })
                router.refresh()
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete template",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive"
            })
        } finally {
            setIsDeleting(false)
            setTemplateToDelete(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
                    <p className="text-muted-foreground">
                        Create and manage your responsive email marketing templates.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Template</DialogTitle>
                            <DialogDescription>
                                Give your template a name to get started.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        className="col-span-3"
                                        placeholder="e.g. Monthly Newsletter"
                                        required
                                        minLength={1}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Template"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/50">
                    <div className="bg-background p-4 rounded-full mb-4">
                        <FileCode className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No templates yet</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                        Get started by creating your first email template. You can code manually or use AI to generate it.
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Template
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {templates.map((template) => (
                        <Card key={template.id} className="flex flex-col overflow-hidden group hover:shadow-md transition-shadow">
                            <CardHeader className="flex-1 p-4 pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base line-clamp-1">
                                            {template.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Last updated {format(new Date(template.updated_at), "MMM d, yyyy")}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">More</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/email-builder/${template.id}`}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive cursor-pointer"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    setTemplateToDelete(template.id)
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="aspect-video bg-muted relative overflow-hidden border-y">
                                    {template.content ? (
                                        <div className="w-[400%] h-[400%] origin-top-left scale-[0.25] pointer-events-none select-none absolute top-0 left-0 bg-white">
                                            <iframe
                                                srcDoc={template.content}
                                                className="w-full h-full border-none"
                                                tabIndex={-1}
                                                title="Preview"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <FileCode className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                    )}
                                    {/* Overlay link to make the whole image clickable */}
                                    <Link href={`/email-builder/${template.id}`} className="absolute inset-0 z-10 block" />
                                </div>
                            </CardContent>
                            <CardFooter className="p-3">
                                <Button variant="secondary" className="w-full text-xs h-8" asChild>
                                    <Link href={`/email-builder/${template.id}`}>
                                        Open Editor
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your email template.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                confirmDelete()
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
