import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "./animated-counter";

interface StatsCardProps {
    title: string;
    value: number;
    description: string;
    icon: LucideIcon;
    className?: string;
    trend?: "up" | "down" | "neutral";
}

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    className,
    trend,
}: StatsCardProps) {
    return (
        <Card className={cn(
            "overflow-hidden relative border-muted/60 bg-gradient-to-br from-background via-background to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group",
            className
        )}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-24 h-24 -mr-8 -mt-8 rotate-12" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-2xl font-bold tracking-tight">
                    <AnimatedCounter value={value} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {description}
                </p>
            </CardContent>
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
        </Card>
    );
}
