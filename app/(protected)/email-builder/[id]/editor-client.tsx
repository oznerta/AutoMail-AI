"use client"

// framer-motion imports should be added at the top, but I can't add them easily with partial replace if they aren't there.
// I will assume I need to do a full file replacement or use multi-replace to add imports.
// I will use replace_file_content to replace the entire return statement logic primarily, or the render part.
// But first I need to ensure imports exist.
// Let's replace the whole file content for safety and quality, as "premium polish" often touches many parts.
// Actually, `EditorClient` is 580 lines. That's large.
// I'll stick to replacing specific blocks but I need to add imports.

// Step 1: Add imports.
// Step 2: Replace Toolbar.

// I will use `replace_file_content` to replace the imports first.
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Editor, { useMonaco } from "@monaco-editor/react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
    Save,
    ArrowLeft,
    Code,
    Eye,
    Columns,
    Bot,
    Braces,
    Loader2,
    Image as ImageIcon,
    Sparkles,
    CheckCircle2,
    Laptop,
    Smartphone,
    MoreVertical,
    Settings,
    Maximize2,
    Minimize2,
    Send
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { updateTemplate, getSenderIdentities } from "../actions"
import { DEFAULT_FALLBACKS, processEmailContent } from "@/utils/email-processor"
import { ImagePicker } from "./image-picker"
import { AiChatPanel } from "./ai-chat-panel"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"


interface Template {
    id: string
    name: string
    subject: string | null
    content: string | null
    created_at: string
    updated_at: string
}

declare global {
    interface Window {
        monaco: any
    }
}

const SAMPLE_VARIABLES = [
    { label: "First Name", value: "{{contact.first_name}}", key: "first_name" },
    { label: "Last Name", value: "{{contact.last_name}}", key: "last_name" },
    { label: "Email", value: "{{contact.email}}", key: "email" },
    { label: "Company", value: "{{contact.company}}", key: "company" },
    { label: "Unsubscribe Link", value: '<a href="{{unsubscribe_url}}" style="color: grey; text-decoration: underline;">Unsubscribe</a>', key: "unsubscribe_url" },
]

export function EditorClient({ template }: { template: Template }) {
    const [name, setName] = useState(template.name)
    const [subject, setSubject] = useState(template.subject || "")
    const [content, setContent] = useState(template.content || "")
    const [isSaving, setIsSaving] = useState(false)
    const [viewMode, setViewMode] = useState<"split" | "code" | "preview">("split")

    // AI State
    // AI State
    const [isAiOpen, setIsAiOpen] = useState(false)
    const [isVariablesPanelOpen, setIsVariablesPanelOpen] = useState(true)

    // Image Picker State
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false)

    // Test Email State
    const [isTestEmailOpen, setIsTestEmailOpen] = useState(false)
    const [senders, setSenders] = useState<any[]>([])
    const [selectedSender, setSelectedSender] = useState("")
    const [testRecipient, setTestRecipient] = useState("")
    const [isSendingTest, setIsSendingTest] = useState(false)
    const [selectedVariable, setSelectedVariable] = useState<any>(null)

    // Personalization / Fallbacks State
    const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false)
    const [variableFallbacks, setVariableFallbacks] = useState<Record<string, string>>(DEFAULT_FALLBACKS)

    // Load fallbacks from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("automail-variable-fallbacks-v3")
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setVariableFallbacks({ ...DEFAULT_FALLBACKS, ...parsed })
            } catch (e) {
                console.error("Failed to parse saved fallbacks", e)
            }
        }
    }, [])

    // Save fallbacks to localStorage
    useEffect(() => {
        localStorage.setItem("automail-variable-fallbacks-v3", JSON.stringify(variableFallbacks))
    }, [variableFallbacks])

    const { toast } = useToast()
    const router = useRouter()

    // For inserting variables at cursor position
    const editorRef = useRef<any>(null)

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor

        // Register Autocomplete for Variables
        monaco.languages.registerCompletionItemProvider('html', {
            triggerCharacters: ['{'],
            provideCompletionItems: (model: any, position: any) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                return {
                    suggestions: SAMPLE_VARIABLES.map((v) => ({
                        label: v.label,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: v.value, // Insert the full {{...}}
                        documentation: "Insert variable: " + v.value,
                        range: range,
                    })),
                };
            },
        });
    }

    const insertTextAtCursor = (text: string) => {
        if (editorRef.current) {
            const editor = editorRef.current;
            const contribution = editor.getContribution('snippetController2');
            if (contribution) {
                // Insert variable at cursor
                editor.trigger('keyboard', 'type', { text: text });
                editor.focus();
            } else {
                // Fallback
                const position = editor.getPosition();
                editor.executeEdits('', [{
                    range: new window.monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                    text: text,
                    forceMoveMarkers: true
                }]);
            }
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateTemplate(template.id, {
                name,
                subject,
                content
            })
            toast({
                title: "Saved successfully",
                description: "Your template has been updated."
            })
            router.refresh()
        } catch (error) {
            toast({
                title: "Error saving",
                description: "Something went wrong.",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleImageSelect = (url: string) => {
        // Simple <img> tag insertion
        const imgTag = `<img src="${url}" alt="Image" style="max-width: 100%; height: auto; display: block;" />`
        insertTextAtCursor(imgTag)
        setIsImagePickerOpen(false)
        toast({
            title: "Image Inserted",
            description: "Image tag added to your template."
        })
    }

    // Auto-save logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            // Don't save if it's the initial load or empty (optional check)
            if (isSaving) return;

            setIsSaving(true);
            try {
                await updateTemplate(template.id, {
                    name,
                    subject,
                    content
                });
                // Optional: Quiet toast or just indicator
            } catch (error) {
                console.error("Auto-save failed", error);
            } finally {
                setIsSaving(false);
            }
        }, 2000); // 2 second debounce

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, subject, content, template.id]);

    // Preview Device State
    const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")

    // Fetch senders when test email dialog opens
    useEffect(() => {
        if (isTestEmailOpen && senders.length === 0) {
            getSenderIdentities().then(setSenders)
        }
    }, [isTestEmailOpen, senders.length])

    const handleSendTest = async () => {
        if (!selectedSender || !testRecipient) {
            toast({
                title: "Missing fields",
                description: "Please select a sender and enter a recipient email.",
                variant: "destructive"
            })
            return
        }

        setIsSendingTest(true)
        try {
            const response = await fetch('/api/send-test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: template.id,
                    senderId: selectedSender,
                    recipientEmail: testRecipient,
                    fallbacks: variableFallbacks
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send test email')
            }

            toast({
                title: "Test email sent!",
                description: `Email sent to ${testRecipient}`
            })
            setIsTestEmailOpen(false)
            setTestRecipient("")
        } catch (error: any) {
            toast({
                title: "Failed to send",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsSendingTest(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] gap-4">
            {/* Top Toolbar - Sticky Glassmorphism */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col sm:flex-row items-center justify-between border-b pb-4 pt-2 gap-4 sm:gap-0 sticky top-0 z-40 bg-background/80 backdrop-blur-md px-1 transition-all"
            >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/email-builder')} className="hover:bg-muted/50 rounded-full">
                        <ArrowLeft className="h-5 w-5 opacity-70" />
                    </Button>
                    <div className="flex flex-col gap-0.5 flex-1 sm:flex-none group">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-8 font-semibold text-lg border-none shadow-none px-0 focus-visible:ring-0 bg-transparent group-hover:bg-muted/20 transition-colors rounded-md pl-1"
                            placeholder="Template Name"
                        />
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 h-3 pl-1">
                            {isSaving ? (
                                <span className="flex items-center gap-1 text-amber-500 animate-pulse">
                                    <Loader2 className="h-2 w-2 animate-spin" /> Saving...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-emerald-500">
                                    <CheckCircle2 className="h-2 w-2" /> Saved
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                    {/* Image Picker Button */}
                    <Dialog open={isImagePickerOpen} onOpenChange={setIsImagePickerOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="hidden md:flex mr-1 gap-2 text-muted-foreground hover:text-foreground">
                                <ImageIcon className="h-4 w-4" />
                                <span className="hidden lg:inline">Media</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Media Library</DialogTitle>
                                <DialogDescription>
                                    Upload or select an image to insert into your email.
                                </DialogDescription>
                            </DialogHeader>
                            <ImagePicker onSelect={handleImageSelect} />
                        </DialogContent>
                    </Dialog>



                    <div className="flex items-center border rounded-md mr-4 shrink-0">
                        <Button
                            variant={viewMode === 'code' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 rounded-none rounded-l-md px-3"
                            onClick={() => setViewMode('code')}
                        >
                            <Code className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Code</span>
                        </Button>
                        <Button
                            variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 rounded-none px-3 border-x hidden md:flex"
                            onClick={() => setViewMode('split')}
                        >
                            <Columns className="h-4 w-4 mr-2" /> Split
                        </Button>
                        <Button
                            variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 rounded-none rounded-r-md px-3"
                            onClick={() => setViewMode('preview')}
                        >
                            <Eye className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Preview</span>
                        </Button>
                    </div>

                    <Button
                        variant={isVariablesPanelOpen ? "secondary" : "ghost"}
                        size="icon"
                        className="mr-2 shrink-0"
                        onClick={() => setIsVariablesPanelOpen(!isVariablesPanelOpen)}
                        title="Toggle Variables Panel"
                    >
                        <Braces className="h-4 w-4" />
                    </Button>

                    <Dialog open={isTestEmailOpen} onOpenChange={setIsTestEmailOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="mr-2 shrink-0">
                                <Send className="mr-2 h-4 w-4" />
                                Send Test
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Send Test Email</DialogTitle>
                                <DialogDescription>
                                    Send a test email to verify your template looks correct.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sender">From (Sender)</Label>
                                    <Select value={selectedSender} onValueChange={setSelectedSender}>
                                        <SelectTrigger id="sender">
                                            <SelectValue placeholder="Select sender..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {senders.map((sender) => (
                                                <SelectItem key={sender.id} value={sender.id}>
                                                    {sender.name} &lt;{sender.email}&gt;
                                                    {!sender.verified && " (Unverified)"}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recipient">To (Recipient)</Label>
                                    <Input
                                        id="recipient"
                                        type="email"
                                        placeholder="recipient@example.com"
                                        value={testRecipient}
                                        onChange={(e) => setTestRecipient(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsTestEmailOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSendTest} disabled={isSendingTest}>
                                    {isSendingTest ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Test
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button onClick={handleSave} disabled={isSaving} size="sm" className="shrink-0">
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save
                    </Button>
                </div>
            </motion.div >

            {/* Subject Line Input */}
            < div className="flex items-center gap-2 px-1" >
                <Label htmlFor="subject" className="w-[80px] text-muted-foreground hidden sm:block">Subject:</Label>
                <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject Line..."
                    className="max-w-2xl bg-muted/30"
                />
            </div >

            {/* Main Editor Area */}
            < div className="flex-1 flex gap-4 min-h-0 overflow-hidden relative" >
                <div className={`flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full transition-all duration-300`}>
                    {/* Left: Code Editor */}
                    <div className={`border rounded-xl overflow-hidden flex flex-col h-full shadow-sm ${(viewMode === 'preview') ? 'hidden' : (viewMode === 'code' ? 'col-span-2' : '')}`}>
                        <div className="bg-muted/50 p-2 border-b flex items-center justify-between backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground pl-2">
                                <Code className="h-3 w-3 text-primary" /> HTML
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <Editor
                                height="100%"
                                defaultLanguage="html"
                                value={content}
                                onChange={(value) => setContent(value || "")}
                                onMount={handleEditorDidMount}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    wordWrap: 'off',
                                    padding: { top: 16 },
                                    lineNumbers: 'on',
                                    glyphMargin: false,
                                    folding: false,
                                    scrollBeyondLastLine: false,
                                }}
                                theme="vs-light"
                            />
                        </div>
                    </div>

                    {/* Right: Live Preview */}
                    <div className={`border rounded-xl overflow-hidden flex flex-col h-full shadow-sm ${(viewMode === 'code') ? 'hidden' : (viewMode === 'preview' ? 'col-span-2' : '')}`}>
                        <div className="bg-muted/50 p-2 border-b flex items-center justify-between backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground pl-2">
                                <Eye className="h-3 w-3 text-primary" /> Preview
                            </div>
                            {/* Device Toggle */}
                            <div className="flex bg-background/50 rounded-lg p-0.5 border">
                                <Button
                                    variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setPreviewDevice("desktop")}
                                    className="h-6 w-7 px-0"
                                    title="Desktop View"
                                >
                                    <Laptop className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setPreviewDevice("mobile")}
                                    className="h-6 w-7 px-0"
                                    title="Mobile View"
                                >
                                    <Smartphone className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-100/50 relative overflow-hidden flex items-center justify-center">
                            <div className={`transition-all duration-300 bg-white shadow-xl ${previewDevice === 'mobile' ? 'w-[375px] h-[667px] rounded-[30px] border-[8px] border-slate-800 overflow-hidden' : 'w-full h-full'}`}>
                                <iframe
                                    title="Preview"
                                    srcDoc={processEmailContent(content, {}, variableFallbacks)}
                                    className="w-full h-full border-none bg-white"
                                    sandbox="allow-same-origin"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Variables Panel (Persistent / Responsive) */}
                {/* Variables Panel (Persistent / Responsive) */}
                <AnimatePresence>
                    {isVariablesPanelOpen && (
                        <motion.div
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            className="w-64 shrink-0 border-l bg-background/50 backdrop-blur-xl flex flex-col h-full absolute md:static z-20 right-0 top-0 bottom-0 shadow-2xl md:shadow-none border-l-border/50"
                        >
                            {/* Panel Header */}
                            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                                <h3 className="font-semibold flex items-center gap-2 text-sm">
                                    <Sparkles className="h-4 w-4 text-primary" /> Toolkit
                                </h3>
                                <Button variant="ghost" size="icon" className="h-6 w-6 md:hidden" onClick={() => setIsVariablesPanelOpen(false)}>
                                    <ArrowLeft className="h-3 w-3" />
                                </Button>
                            </div>

                            {/* AI CTA Section */}
                            <div className="p-4 border-b bg-gradient-to-b from-primary/5 to-transparent">
                                <Button
                                    className="w-full shadow-sm bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-600 border-0"
                                    onClick={() => setIsAiOpen(true)}
                                >
                                    <Bot className="mr-2 h-4 w-4" />
                                    Create with AI
                                </Button>
                            </div>

                            {/* Variables List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                <div className="pb-2 pt-1 px-1">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Braces className="h-3 w-3" /> Variables
                                    </h4>
                                </div>
                                {SAMPLE_VARIABLES.map((v) => (
                                    <motion.div
                                        key={v.value}
                                        drag
                                        dragSnapToOrigin
                                        whileHover={{ scale: 1.02 }}
                                        whileDrag={{ scale: 1.1, zIndex: 50, cursor: 'grabbing' }}
                                        className="p-3 bg-card border rounded-lg cursor-grab hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all group active:cursor-grabbing"
                                        onClick={() => setSelectedVariable(v)}
                                        title="Click to configure"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-foreground/80">{v.label}</span>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Settings className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-mono text-muted-foreground bg-muted/50 p-1.5 rounded border border-transparent group-hover:border-primary/10 overflow-hidden text-ellipsis whitespace-nowrap select-none">
                                            {v.value}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Variable Detail Modal */}
                <Dialog open={!!selectedVariable} onOpenChange={(open) => !open && setSelectedVariable(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedVariable?.label}</DialogTitle>
                            <DialogDescription>
                                Configure this variable or copy it to your clipboard.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedVariable && (
                            <div className="space-y-4 py-4">
                                {/* Copy Code */}
                                <div className="space-y-2">
                                    <Label>Variable Code</Label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 p-2 bg-muted rounded text-sm font-mono border flex items-center">
                                            {selectedVariable.value}
                                        </code>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => {
                                                navigator.clipboard.writeText(selectedVariable.value)
                                                toast({ title: "Copied!", description: "Variable code copied to clipboard" })
                                            }}
                                            title="Copy to Clipboard"
                                        >
                                            <Code className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            onClick={() => {
                                                insertTextAtCursor(selectedVariable.value)
                                                setSelectedVariable(null)
                                            }}
                                            title="Insert into Editor"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Preview/Fallback Value */}
                                <div className="space-y-2">
                                    <Label>Preview / Fallback Value</Label>
                                    <Input
                                        value={variableFallbacks[selectedVariable.key] || ""}
                                        onChange={(e) => {
                                            setVariableFallbacks(prev => ({
                                                ...prev,
                                                [selectedVariable.key]: e.target.value
                                            }))
                                        }}
                                        placeholder={`e.g. ${selectedVariable.label === "First Name" ? "John" : "Value"}`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This value will be shown in the preview and used as a fallback if data is missing.
                                    </p>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

            </div>

            {/* AI Chat Panel */}
            <AiChatPanel
                open={isAiOpen}
                onOpenChange={setIsAiOpen}
                currentContent={content}
                onApply={(newContent) => setContent(newContent)}
            />
        </div>
    )
}
