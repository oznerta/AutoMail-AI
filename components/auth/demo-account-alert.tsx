"use client"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Sparkles } from "lucide-react"

interface DemoAccountAlertProps {
    onFill: (email: string, pass: string) => void;
}

export function DemoAccountAlert({ onFill }: DemoAccountAlertProps) {
    return (
        <Alert className="bg-primary/5 border-primary/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="h-4 w-4 text-primary absolute top-4 left-4" />
            <div className="pl-6">
                <AlertTitle className="text-primary font-medium flex items-center gap-2 mb-1">
                    Demo Account Available
                </AlertTitle>
                <AlertDescription className="flex flex-col gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                        Want to explore without signing up? Use our demo credentials.
                    </p>
                    <div className="flex items-center justify-between bg-background/50 p-2 rounded border border-border/50 text-xs font-mono">
                        <div className="flex flex-col">
                            <span className="opacity-70">Email:</span>
                            <span>test@example.com</span>
                        </div>
                        <div className="h-4 w-px bg-border" />
                        <div className="flex flex-col">
                            <span className="opacity-70">Pass:</span>
                            <span>test-acc-1</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] uppercase font-bold text-primary hover:text-primary hover:bg-primary/10 ml-2"
                            onClick={() => onFill("test@example.com", "test-acc-1")}
                        >
                            Auto-Fill
                        </Button>
                    </div>
                </AlertDescription>
            </div>
        </Alert>
    )
}
