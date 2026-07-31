'use client';

import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    
    setIsMobile(mql.matches);

    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}