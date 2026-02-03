import { getCampaign } from "../actions";
import { CampaignBuilder } from "../campaign-builder";
import { notFound } from "next/navigation";

export default async function CampaignBuilderPage({ params }: { params: { id: string } }) {
    const campaign = await getCampaign(params.id);

    if (!campaign) {
        notFound();
    }

    return <CampaignBuilder campaign={campaign} />;
}
