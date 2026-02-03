
import Link from "next/link"

export default function EmailSetupPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">Email Setup Guide</h1>
                <p className="text-lg text-muted-foreground">
                    configure your sender identity to ensure high deliverability.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">1. Configuration</h2>
                <p>
                    Go to <Link href="/settings?tab=byok" className="underline text-primary">Settings &gt; BYOK Config</Link> and enter your Resend API Key.
                    This is required to send emails through our platform.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">2. Verify Domain</h2>
                <p>
                    AutoMail AI uses Resend for delivery. You must verify your domain in the Resend Dashboard to prove ownership.
                    Once verified, you can send from any address on that domain (e.g., <code>hello@yourdomain.com</code>).
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">3. Add Senders</h2>
                <p>
                    Go to <Link href="/settings?tab=senders" className="underline text-primary">Settings &gt; Senders</Link> and add the email addresses you want to appear in the &quot;From&quot; field.
                </p>
            </div>
        </div>
    )
}
