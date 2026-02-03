import { getTemplates } from "./actions"
import { TemplatesList } from "./templates-list"

export const metadata = {
    title: "Email Builder | AutoMail AI",
    description: "Create and manage your email templates",
}

export default async function EmailBuilderPage() {
    const templates = await getTemplates()

    return (
        <div className="h-full p-4 md:p-8 overflow-y-auto">
            <TemplatesList templates={templates || []} />
        </div>
    )
}
