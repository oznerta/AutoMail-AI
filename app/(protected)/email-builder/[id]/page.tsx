import { notFound } from "next/navigation"
import { getTemplate } from "../actions"
import { EditorClient } from "./editor-client"

export const metadata = {
    title: "Edit Template | AutoMail AI",
}

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditTemplatePage({ params }: PageProps) {
    const { id } = await params
    const template = await getTemplate(id)

    if (!template) {
        notFound()
    }

    return <EditorClient template={template} />
}
