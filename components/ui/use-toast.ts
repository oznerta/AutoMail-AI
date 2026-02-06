"use client"

import { toast as sonnerToast } from "sonner"

type ToastProps = {
    title?: string
    description?: string
    variant?: "default" | "destructive" | "success"
    action?: React.ReactNode
}

function toast({ title, description, variant, ...props }: ToastProps) {
    if (variant === "destructive") {
        return sonnerToast.error(title, {
            description,
            ...props,
        })
    }
    if (variant === "success") {
        return sonnerToast.success(title, {
            description,
            ...props,
        })
    }
    return sonnerToast(title, {
        description,
        ...props,
    })
}

function useToast() {
    return {
        toast,
        dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
    }
}

export { useToast, toast }
