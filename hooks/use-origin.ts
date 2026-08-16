"use client";

import { useEffect, useState } from "react";
import { getURL } from "@/utils/supabase/client";

/**
 * Hook that automatically resolves the active origin/base URL.
 * Automatically adapts to localhost, preview deployments, or custom production domains.
 */
export function useOrigin(): string {
    const [origin, setOrigin] = useState<string>("");

    useEffect(() => {
        if (typeof window !== "undefined" && window.location?.origin) {
            setOrigin(window.location.origin);
        }
    }, []);

    // Fallback to getURL() during SSR or before mount
    return origin || (typeof window !== "undefined" && window.location?.origin ? window.location.origin : getURL());
}
