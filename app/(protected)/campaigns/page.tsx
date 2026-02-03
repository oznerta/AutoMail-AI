'use server'

import { getCampaigns, createCampaign, deleteCampaign } from "./actions";
import { CampaignList } from "./campaign-list"; // Client component
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CampaignsPage() {
    const campaigns = await getCampaigns();

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                    <p className="text-muted-foreground">Broadcast one-off emails to your audience.</p>
                </div>
                {/* We pass the create action to the client list or handle it there? 
                    Better to keep page server-side and pass initial data. 
                    The 'Create' button needs interactivity (dialog), so it belongs in Client Component 
                    or a separate 'CreateCampaignButton'. */}
            </div>

            <CampaignList initialCampaigns={campaigns} />
        </div>
    );
}
