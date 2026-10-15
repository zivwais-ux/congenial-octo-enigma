import { useCallback } from 'react';
import { useStore } from '../store/StoreProvider';
import { useToast } from '../components/ui/Toast';

/** החלפת משתמש הדמו, עם הודעה קצרה */
export function useSwitchUser() {
  const { state, update } = useStore();
  const toast = useToast();
  return useCallback(
    (id: string, quiet = false) => {
      if (id === state.currentUserId) return;
      update((s) => ({ ...s, currentUserId: id }));
      const u = state.users.find((x) => x.id === id);
      if (u && !quiet) toast(`עברת לתצוגה של ${u.name} · ${u.title}`, { tone: 'info' });
    },
    [state.currentUserId, state.users, update, toast],
  );
}
