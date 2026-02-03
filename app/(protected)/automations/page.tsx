import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Plus, Clock, MoreVertical, Edit, PlayCircle, PauseCircle } from "lucide-react";
import { getAutomations } from "./actions";
import { CreateAutomationButton } from "./create-button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function AutomationsPage() {
    const automations = await getAutomations();

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Automations</h1>
                    <p className="text-sm text-muted-foreground">
                        Configure your automated email workflows.
                    </p>
                </div>
                <CreateAutomationButton />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {automations.map((automation) => (
                    <Card key={automation.id} className={cn("flex flex-col transition-opacity", automation.status === 'paused' && "opacity-80")}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Badge variant={automation.status === 'active' ? 'default' : 'secondary'}>
                                {automation.status === 'active' ? 'Active' : (automation.status === 'paused' ? 'Paused' : 'Draft')}
                            </Badge>
                            {/* <Clock className="w-4 h-4 text-muted-foreground" /> */}
                        </CardHeader>
                        <CardHeader>
                            <CardTitle className="truncate" title={automation.name}>{automation.name}</CardTitle>
                            <CardDescription className="line-clamp-2 min-h-[40px]">
                                {automation.description || "No description provided."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <GitBranch className="h-4 w-4" />
                                {automation.workflow_config?.steps?.length || 0} Steps
                            </div>
                            <div className="mt-4 flex flex-col gap-2">
                                <div className="text-xs bg-muted p-2 rounded flex justify-between">
                                    <span>Trigger:</span>
                                    <span className="font-mono">{automation.trigger_type || "Not Configured"}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 border-t gap-2">
                            <Link href={`/automations/${automation.id}`} className="w-full">
                                <Button variant="ghost" size="sm" className="w-full justify-start">
                                    <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}

                {/* Empty State / New Card for Grid */}
                <div className="contents sm:contents">
                    {/* We reuse the Create Button logic but style it as a card here implies we need to expose the trigger manually or just let the button handle it. 
                       Actually, let's keep the 'Create New' card as a trigger for the dialog. 
                       Since the Dialog is inside CreateAutomationButton, we can wrap the card content in the trigger there or just duplicate it.
                       For simplicity, let's just make the top button the primary way, and maybe add a big card if list is empty.
                   */}
                    {automations.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg bg-muted/10">
                            <div className="p-4 rounded-full bg-muted mb-4">
                                <GitBranch className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No automations yet</h3>
                            <p className="text-muted-foreground mb-4 max-w-sm">
                                Create your first automation workflow to start sending emails on autopilot.
                            </p>
                            {/* This button is already top right, but good to have here too used as a visual cue. 
                                 Ideally we'd reuse the dialog trigger. For now, let's just leave the top button.
                             */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
