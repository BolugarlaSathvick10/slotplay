/**
 * components/auth/AuthHydrator.tsx
 *
 * Invisible component rendered inside Providers.
 * Calls /api/auth/me once on mount to restore the session user into Zustand.
 * This is what makes "stay logged in" work across page reloads.
 */

'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function AuthHydrator() {
  const { hydrate } = useAuth();

  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  return null; // renders nothing
}
