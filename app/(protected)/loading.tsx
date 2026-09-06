import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton-loader";

export default function ProtectedLoading() {
    return (
        <div className="flex flex-col gap-8 w-full animate-fade-in p-2">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-72 bg-muted/60 rounded animate-pulse" />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>

            <TableSkeleton />
        </div>
    );
}
