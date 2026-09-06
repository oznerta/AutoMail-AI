'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MailX, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    const isSuccess = searchParams.get('success') === 'true';

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
        isSuccess ? 'success' : 'idle'
    );
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        if (isSuccess) {
            setStatus('success');
            return;
        }

        if (id || email) {
            setStatus('loading');
            fetch(`/api/unsubscribe?${new URLSearchParams({ ...(id && { id }), ...(email && { email }) }).toString()}`, {
                method: 'POST',
            })
                .then(async (res) => {
                    if (res.ok) {
                        setStatus('success');
                    } else {
                        const data = await res.json().catch(() => ({}));
                        setStatus('error');
                        setMessage(data.error || 'Unable to complete your request.');
                    }
                })
                .catch(() => {
                    setStatus('error');
                    setMessage('A network error occurred. Please try again.');
                });
        }
    }, [id, email, isSuccess]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-xl p-8 text-center backdrop-blur-md">
                <div className="flex justify-center mb-6">
                    <Logo />
                </div>

                {status === 'loading' && (
                    <div className="space-y-4 py-8">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                        <h2 className="text-xl font-semibold text-foreground">Processing Unsubscribe Request...</h2>
                        <p className="text-sm text-muted-foreground">Updating your email preferences.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-4 py-4">
                        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Unsubscribed Successfully</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {email ? (
                                <>
                                    <span className="font-medium text-foreground">{email}</span> has been removed from our automated sending list.
                                </>
                            ) : (
                                'You have been successfully removed from this automated sending list.'
                            )}
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                            You will no longer receive marketing or campaign emails from this sender.
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4 py-4">
                        <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Request Failed</h2>
                        <p className="text-sm text-muted-foreground">{message || 'We could not process your unsubscribe request.'}</p>
                        {(id || email) && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStatus('loading');
                                    fetch(`/api/unsubscribe?${new URLSearchParams({ ...(id && { id }), ...(email && { email }) }).toString()}`, {
                                        method: 'POST',
                                    })
                                        .then((r) => setStatus(r.ok ? 'success' : 'error'))
                                        .catch(() => setStatus('error'));
                                }}
                            >
                                Try Again
                            </Button>
                        )}
                    </div>
                )}

                {status === 'idle' && !id && !email && (
                    <div className="space-y-4 py-4">
                        <div className="w-14 h-14 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto">
                            <MailX className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Email Preferences</h2>
                        <p className="text-sm text-muted-foreground">
                            Please click the unsubscribe link directly in the email you received to manage your subscription.
                        </p>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-border/50">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                            Return to AutoMail AI
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            }
        >
            <UnsubscribeContent />
        </Suspense>
    );
}
