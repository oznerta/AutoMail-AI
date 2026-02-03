import { notFound } from "next/navigation"
import { getTemplate } from "../actions"
import { EditorClient } from "./editor-client"

export const metadata = {
    title: "Edit Template | AutoMail AI",
}

interface PageProps {
    params: {
        id: string
    }
}

export default async function EditTemplatePage({ params }: PageProps) {
    const template = await getTemplate(params.id)

    if (!template) {
        notFound()
    }

    return <EditorClient template={template} />
}
