"use client";

import { useEffect, useState } from "react";
import { getServerURL } from "@/utils/supabase/client";

/**
 * Hook that automatically resolves the active origin/base URL.
 * Prevents React SSR hydration mismatches by returning a consistent
 * server URL during initial render, and dynamically updating to window.location.origin after mount.
 */
export function useOrigin(): string {
    const [origin, setOrigin] = useState<string>("");

    useEffect(() => {
        if (typeof window !== "undefined" && window.location?.origin) {
            setOrigin(window.location.origin);
        }
    }, []);

    // Return client origin once mounted, or server URL during SSR & initial hydration
    return origin || getServerURL();
}
