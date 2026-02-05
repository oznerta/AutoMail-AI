export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Return children directly so pages can control full layout width/height
    return <>{children}</>;
}
