'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { StepWelcome } from "@/components/onboarding/step-welcome";
import { StepImportContacts } from "@/components/onboarding/step-import-contacts";
import { StepApiKeys } from "@/components/onboarding/step-api-keys";
import { StepSenderIdentity } from "@/components/onboarding/step-sender-identity";
import { AnimatePresence, motion } from "framer-motion";
import { completeOnboarding } from "@/app/onboarding/actions";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const TOTAL_STEPS = 4;

    const nextStep = () => setStep(prev => Math.min(prev + 1, TOTAL_STEPS + 1));
    const skipStep = () => nextStep();

    const [isCompleting, setIsCompleting] = useState(false);
    const { toast } = useToast();

    // If step > TOTAL_STEPS, trigger completion
    const [stepExceeded, setStepExceeded] = useState(false);

    // Final completion - save status and redirect
    const handleFinish = async () => {
        if (isCompleting) return;
        setIsCompleting(true);
        try {
            await completeOnboarding();
            router.push("/dashboard");
        } catch (error) {
            toast({ title: "Error", description: "Failed to complete onboarding", variant: "destructive" });
            setIsCompleting(false);
        }
    };

    if (step > TOTAL_STEPS || isCompleting) {
        if (!isCompleting && !stepExceeded) {
            setStepExceeded(true);
            handleFinish();
        }
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Completing setup and preparing your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <OnboardingLayout step={step} totalSteps={TOTAL_STEPS}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                >
                    {step === 1 && <StepWelcome onNext={nextStep} />}
                    {step === 2 && <StepImportContacts onNext={nextStep} onSkip={skipStep} />}
                    {step === 3 && <StepApiKeys onNext={nextStep} onSkip={skipStep} />}
                    {step === 4 && <StepSenderIdentity onNext={handleFinish} onBack={() => setStep(3)} />}
                </motion.div>
            </AnimatePresence>
        </OnboardingLayout>
    );
}
