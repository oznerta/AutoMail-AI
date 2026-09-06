"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

export function AnimatedCounter({
    value = 0,
    direction = "up",
}: {
    value: number;
    direction?: "up" | "down";
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const formattedInitial = Intl.NumberFormat("en-US").format(value);

    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        damping: 30,
        stiffness: 150,
    });
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (value === 0) {
            if (ref.current) ref.current.textContent = "0";
            return;
        }

        if (isInView) {
            motionValue.set(value);
        }
    }, [isInView, value, motionValue]);

    useEffect(() => {
        if (value === 0) return;

        const unsubscribe = springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Intl.NumberFormat("en-US").format(
                    Math.floor(latest)
                );
            }
        });

        return () => unsubscribe();
    }, [springValue, value]);

    return <span ref={ref}>{formattedInitial}</span>;
}

