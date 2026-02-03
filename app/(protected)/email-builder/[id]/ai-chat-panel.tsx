"use client"

import { useState, useRef, useEffect } from "react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bot, User, Loader2, Send, Wand2, ArrowLeft } from "lucide-react"
import { generateEmailContent } from "../actions"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface Message {
    role: "user" | "assistant"
    content: string
}

interface AiChatPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentContent: string
    onApply: (content: string) => void
}

export function AiChatPanel({ open, onOpenChange, currentContent, onApply }: AiChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [model, setModel] = useState("gpt-5.2")
    const scrollRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMsg: Message = { role: "user", content: input }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsLoading(true)

        try {
            // Convert UI messages to API format (including current user msg)
            const apiMessages = [...messages, userMsg].map(m => ({
                role: m.role,
                content: m.content
            })) as any

            const result = await generateEmailContent(apiMessages, model, currentContent)

            if (result.error) {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive"
                })
                // Remove failed user message or just show error? Let's keep it but show error.
            } else if (result.content) {
                const aiMsg: Message = { role: "assistant", content: result.content }
                setMessages(prev => [...prev, aiMsg])
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to communicate with AI.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        AI Co-pilot
                    </SheetTitle>
                    <SheetDescription>
                        Chat with AI to generate or edit your email.
                    </SheetDescription>
                    <div className="pt-2">
                        <Select value={model} onValueChange={setModel}>
                            <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gpt-5.2">GPT-5.2 (Best)</SelectItem>
                                <SelectItem value="gpt-5-mini">GPT-5 Mini (Fast)</SelectItem>
                                <SelectItem value="o1-preview">o1-preview (Deep Think)</SelectItem>
                                <SelectItem value="gpt-4o">GPT-4o (Legacy)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-10 space-y-2">
                            <Bot className="h-12 w-12 mx-auto opacity-20" />
                            <p>Ask me to create a layout, write copy, or style your email.</p>
                            <div className="grid grid-cols-1 gap-2 mt-4 max-w-xs mx-auto">
                                <Button variant="outline" size="sm" onClick={() => setInput("Create a welcome email for a fashion brand")}>
                                    &quot;Create a welcome email...&quot;
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setInput("Make the header background dark blue")}>
                                    &quot;Make header dark blue...&quot;
                                </Button>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={cn(
                            "flex flex-col gap-2 max-w-[90%]",
                            msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                        )}>
                            <div className={cn(
                                "p-3 rounded-lg text-sm",
                                msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                    : "bg-white border shadow-sm rounded-bl-none"
                            )}>
                                {msg.role === "assistant" && msg.content.includes("<html") ? (
                                    <div className="space-y-2">
                                        <div className="text-xs font-mono bg-slate-100 p-1 rounded border">
                                            HTML Code Generated
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full h-7"
                                            onClick={() => {
                                                onApply(msg.content)
                                                toast({ title: "Applied to Editor" })
                                                onOpenChange(false)
                                            }}
                                        >
                                            <Wand2 className="h-3 w-3 mr-2" /> Apply to Editor
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Thinking...
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                <div className="p-4 border-t bg-background">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
