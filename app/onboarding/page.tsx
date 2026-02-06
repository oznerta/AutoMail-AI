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

    // Final completion - save status and redirect
    const handleFinish = async () => {
        setIsCompleting(true);
        try {
            await completeOnboarding();
            router.push("/dashboard");
        } catch (error) {
            toast({ title: "Error", description: "Failed to complete onboarding", variant: "destructive" });
            setIsCompleting(false);
        }
    };

    // If step > TOTAL_STEPS, we are done
    if (step > TOTAL_STEPS) {
        // Render nothing, or a loading state if we want better UX
        // But preventing the loop calls here is actually important. 
        // We should trigger handleFinish only ONCE if we use an effect, 
        // OR just rely on the last step calling handleFinish directly.
        // The original logic called handleFinish in render which is bad.
        // Let's remove this render-time check and ensure handleFinish is called by button click.
        return null;
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
