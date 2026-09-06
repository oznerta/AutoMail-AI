"use client";

import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface GrowthDataPoint {
    name: string;
    total: number;
    new?: number;
}

interface OverviewChartProps {
    data: GrowthDataPoint[];
}

export function OverviewChart({ data }: OverviewChartProps) {
    const [view, setView] = useState<"total" | "new">("total");

    const latestPoint = data && data.length > 0 ? data[data.length - 1] : { total: 0, new: 0 };
    const currentAudience = latestPoint.total;

    return (
        <Card className="col-span-4 border-muted/60 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
                <div>
                    <CardTitle className="text-base font-semibold">Subscriber Growth</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {view === "total" 
                            ? `Total audience throughout ${new Date().getFullYear()} (${currentAudience} current)` 
                            : `New subscribers gained per month (${new Date().getFullYear()})`}
                    </p>
                </div>
                {/* View toggle */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setView("total")}
                        className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                            view === "total"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Total Audience
                    </button>
                    <button
                        type="button"
                        onClick={() => setView("new")}
                        className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                            view === "new"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Monthly Signups
                    </button>
                </div>
            </CardHeader>
            <CardContent className="pl-2 pt-2">
                <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                            domain={[0, (dataMax: number) => Math.max(dataMax + 2, 4)]}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const point = payload[0].payload as GrowthDataPoint;
                                    return (
                                        <div className="rounded-lg border bg-popover/95 backdrop-blur-sm p-3 shadow-lg text-xs space-y-1.5 min-w-[140px]">
                                            <p className="font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-muted-foreground">Total Audience:</span>
                                                <span className="font-bold text-foreground">{point.total}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 pt-1 border-t border-muted/40">
                                                <span className="text-muted-foreground">New Signups:</span>
                                                <span className="font-semibold text-teal-600 dark:text-teal-400">
                                                    +{point.new ?? 0}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey={view === "total" ? "total" : "new"}
                            stroke="#14b8a6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            dot={{ r: 3, fill: "#14b8a6", strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: "#14b8a6", stroke: "#ffffff", strokeWidth: 2 }}
                            isAnimationActive={true}
                            animationDuration={600}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
