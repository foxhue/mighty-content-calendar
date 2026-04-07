'use client';

import { useRef, useEffect } from 'react';
import type { WorkspaceConfig, CalendarApprovalRow } from '@/lib/types';
import { initCalendar } from '@/lib/calendar';

// Config without sensitive fields (reviewToken, clientEmail stripped server-side)
type SafeConfig = Omit<WorkspaceConfig, 'reviewToken' | 'clientEmail'>;

interface Props {
  config: SafeConfig;
  initialData: CalendarApprovalRow[];
}

export default function CalendarClient({ config, initialData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // CSS is injected server-side via <style> in page.tsx — no client injection needed
    cleanupRef.current = initCalendar(
      containerRef.current,
      config as WorkspaceConfig,
      initialData
    );

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [config, initialData]);

  return <div ref={containerRef} />;
}
