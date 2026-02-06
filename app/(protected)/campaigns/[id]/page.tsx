import { getCampaign } from "../actions";
import { CampaignBuilder } from "../campaign-builder";
import { notFound } from "next/navigation";

export default async function CampaignBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const campaign = await getCampaign(id);

    if (!campaign) {
        notFound();
    }

    return <CampaignBuilder campaign={campaign} />;
}
