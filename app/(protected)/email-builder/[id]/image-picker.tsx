"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { Loader2, Upload, Image as ImageIcon, Trash2, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface ImagePickerProps {
    onSelect: (url: string) => void
}

interface StorageFile {
    name: string
    url: string
    created_at: string
}

export function ImagePicker({ onSelect }: ImagePickerProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [images, setImages] = useState<StorageFile[]>([])
    const [dragActive, setDragActive] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const { toast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const fetchImages = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id) // Cache User ID

            const { data, error } = await supabase
                .storage
                .from('email_media')
                .list(user.id, {  // List inside user's folder
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' },
                })

            if (error) throw error

            if (data) {
                const files = data.map(file => {
                    // Public URL must include the folder path
                    const fullPath = `${user.id}/${file.name}`
                    const { data: { publicUrl } } = supabase
                        .storage
                        .from('email_media')
                        .getPublicUrl(fullPath)

                    return {
                        name: fullPath, // Store full path for deletion
                        url: publicUrl,
                        created_at: file.created_at
                    }
                })
                setImages(files)
            }
        } catch (error) {
            console.error("Error fetching images:", error)
            toast({
                title: "Error",
                description: "Failed to load images.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }, [supabase, toast])

    // Initial fetch
    useEffect(() => {
        fetchImages()
    }, [fetchImages])

    const handleUpload = async (file: File) => {
        if (!file) return

        // Validate type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file",
                description: "Please upload an image file (PNG, JPG, GIF).",
                variant: "destructive"
            })
            return
        }

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Max file size is 5MB.",
                variant: "destructive"
            })
            return
        }

        if (!userId) {
            toast({
                title: "Error",
                description: "User session not found.",
                variant: "destructive"
            })
            return
        }

        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            // CRITICAL FIX: Upload to user's folder
            const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('email_media')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            toast({
                title: "Upload successful",
                description: "Image has been added to your library.",
            })

            // Refresh list and switch tab (optional, checking implementation)
            await fetchImages()

            // Auto-select needed? Maybe just refresh.
        } catch (error) {
            console.error("Upload error:", error)
            toast({
                title: "Upload failed",
                description: "Could not upload image. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsUploading(false)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0])
        }
    }

    const handleDelete = async (fileName: string) => {
        if (!confirm("Delete this image?")) return

        try {
            const { error } = await supabase
                .storage
                .from('email_media')
                .remove([fileName])

            if (error) throw error

            setImages(prev => prev.filter(img => img.name !== fileName))
            toast({
                title: "Deleted",
                description: "Image removed from storage.",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete image.",
                variant: "destructive"
            })
        }
    }

    return (
        <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload New</TabsTrigger>
                <TabsTrigger value="library">My Images</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
                <div
                    className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[200px]",
                        dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                        isUploading && "opacity-50 pointer-events-none"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    />

                    {isUploading ? (
                        <>
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <div className="bg-primary/10 p-4 rounded-full">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-medium text-lg">Click to upload</h3>
                                <p className="text-sm text-muted-foreground">or drag and drop SVG, PNG, JPG</p>
                            </div>
                        </>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="library" className="mt-4">
                <div className="flex justify-end mb-2">
                    <Button variant="ghost" size="sm" onClick={fetchImages} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                    {images.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 min-h-[100px]">
                            <ImageIcon className="h-8 w-8 opacity-50" />
                            <p>No images found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-4">
                            {images.map((img) => (
                                <div key={img.name} className="group relative aspect-square rounded-md border overflow-hidden bg-muted">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={img.url}
                                        alt={img.name}
                                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="h-8 w-20"
                                            onClick={() => onSelect(img.url)}
                                        >
                                            <Check className="h-4 w-4 mr-1" /> Use
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(img.name)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </TabsContent>
        </Tabs>
    )
}
