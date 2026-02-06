import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-md p-8 space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Authentication Failed</h1>
                <p className="text-muted-foreground">
                    We couldn't verify your sign-in details. This link may have expired or is invalid.
                </p>
                <div className="pt-4">
                    <Link href="/login">
                        <Button className="w-full">Back to Login</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
