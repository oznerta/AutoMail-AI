import { useQuery } from '@tanstack/react-query';

async function fetchTags() {
    const res = await fetch('/api/tags');
    if (!res.ok) throw new Error('Failed to fetch tags');
    const data = await res.json();
    return (data.tags || []).map((t: any) => t.name) as string[];
}

export function useTags() {
    const { data: tags, isLoading, error } = useQuery({
        queryKey: ['tags'],
        queryFn: fetchTags,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return { tags: tags || [], isLoading, error };
}
