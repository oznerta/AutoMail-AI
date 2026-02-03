import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { checkOnboardingStatus } from "@/app/onboarding/actions";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const status = await checkOnboardingStatus();
    // If not authenticated, checkOnboardingStatus returns error.
    // Assuming this layout might already have auth check (it did in previous view), 
    // but checkOnboardingStatus internally checks auth too.

    if (status.error) {
        redirect("/login");
    }

    if (!status.isComplete) {
        redirect("/onboarding");
    }

    return (
        <div className="min-h-screen w-full">
            <div className="hidden border-r bg-muted/40 md:block fixed inset-y-0 left-0 z-10 w-[220px] lg:w-[280px]">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    {/* Sidebar */}
                    <Sidebar />
                </div>
            </div>
            <div className="flex flex-col md:pl-[220px] lg:pl-[280px]">
                {/* Top Nav */}
                <TopNav />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
