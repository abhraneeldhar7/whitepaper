"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "dismissed:";

export function useDismissible(id: string) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (stored !== "true") {
      setVisible(true);
    }
    
  }, [id]);

  const dismiss = useCallback(() => {
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, "true");
    setVisible(false);
  }, [id]);

  return { visible, dismiss };
}
