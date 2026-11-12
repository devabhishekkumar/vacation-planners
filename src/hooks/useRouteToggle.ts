'use client';
import { useCallback, useState, type SetStateAction } from 'react';
import { usePathname } from 'next/navigation';

/** Reset transient menus on navigation, including browser back/forward. */
export function useRouteToggle() {
  const pathname = usePathname();
  const [state, setState] = useState({ pathname, open: false });
  if (state.pathname !== pathname) setState({ pathname, open: false });
  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setState((previous) => ({
        pathname,
        open:
          typeof value === 'function'
            ? value(previous.pathname === pathname && previous.open)
            : value,
      }));
    },
    [pathname],
  );
  return [state.pathname === pathname && state.open, setOpen] as const;
}
