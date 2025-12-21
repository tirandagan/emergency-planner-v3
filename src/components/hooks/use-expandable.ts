import { useState, useCallback } from "react";
import { useSpring } from "framer-motion";

export function useExpandable(initialState = false): {
  isExpanded: boolean;
  toggleExpand: () => void;
  animatedHeight: ReturnType<typeof useSpring>;
} {
  const [isExpanded, setIsExpanded] = useState(initialState);

  const springConfig = { stiffness: 300, damping: 30 };
  const animatedHeight = useSpring(0, springConfig);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return { isExpanded, toggleExpand, animatedHeight };
}
