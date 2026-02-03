export default function AutomationEditorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-6">
            {children}
        </div>
    )
}
