import { useEffect, useCallback, useRef } from 'react';

const EVENT_NAME = 'carton-crm:reminder-refresh';

/**
 * Call this after any action that changes nextFollowUp data
 * (e.g. saving a customer's follow-up date).
 */
export function dispatchReminderRefresh() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

/**
 * Hook: listens for reminder-refresh events and calls the provided callback.
 * Use in components that display reminder counts (NotificationBell, Sidebar).
 */
export function useReminderRefresh(onRefresh: () => void) {
  // Use ref to always call the latest callback without re-registering listener
  const cbRef = useRef(onRefresh);
  cbRef.current = onRefresh;

  useEffect(() => {
    const handler = () => cbRef.current();
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);
}
