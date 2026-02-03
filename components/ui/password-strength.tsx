import { Progress } from "@/components/ui/progress";
import {
    calculatePasswordStrength,
    getPasswordStrengthLabel,
    getPasswordStrengthColor,
} from "@/lib/validation/auth";

interface PasswordStrengthProps {
    password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
    if (!password) return null;

    const strength = calculatePasswordStrength(password);
    const label = getPasswordStrengthLabel(strength);
    const colorClass = getPasswordStrengthColor(strength);

    return (
        <div className="space-y-2">
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${colorClass}`}
                    style={{ width: `${strength}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground">
                Password strength: <span className="font-medium">{label}</span>
            </p>
        </div>
    );
}
