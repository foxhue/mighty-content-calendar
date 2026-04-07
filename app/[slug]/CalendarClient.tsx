'use client';

import { useRef, useEffect } from 'react';
import type { WorkspaceConfig, CalendarApprovalRow } from '@/lib/types';
import { getCalendarCSS } from '@/lib/calendar-styles';
import { initCalendar } from '@/lib/calendar';

interface Props {
  config: WorkspaceConfig;
  initialData: CalendarApprovalRow[];
}

export default function CalendarClient({ config, initialData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = getCalendarCSS(config);
    document.head.appendChild(style);

    // Initialize calendar
    cleanupRef.current = initCalendar(containerRef.current, config, initialData);

    return () => {
      if (cleanupRef.current) cleanupRef.current();
      style.remove();
    };
  }, [config, initialData]);

  return <div ref={containerRef} />;
}
