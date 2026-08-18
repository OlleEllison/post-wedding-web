import { supabase } from '@/integrations/supabase/client';

const TOKEN_KEY = 'wedding_session_token';

export const getSessionToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY);

export const setSessionToken = (token: string) =>
  localStorage.setItem(TOKEN_KEY, token);

export const clearSessionToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * The guest id is the first segment of the server-signed token.
 * It is only used for optimistic UI; the server re-derives it from the
 * signature on every write, so it cannot be spoofed.
 */
export const getGuestId = (): string | null => {
  const token = getSessionToken();
  if (!token) return null;
  const [id] = token.split('.');
  return id || null;
};

type GuestAction =
  | 'list_memories'
  | 'post_memory'
  | 'delete_memory'
  | 'register_photo'
  | 'delete_photo';

export async function callGuestApi<T>(
  action: GuestAction,
  payload: Record<string, unknown> = {},
): Promise<{ data: T | null; error: string | null }> {
  const token = getSessionToken();
  if (!token) return { data: null, error: 'Ingen giltig session' };

  const { data, error } = await supabase.functions.invoke('guest-content', {
    body: { action, token, ...payload },
  });

  if (error) {
    const message =
      (data as { error?: string } | null)?.error ?? 'Något gick fel';
    return { data: null, error: message };
  }
  if ((data as { error?: string })?.error) {
    return { data: null, error: (data as { error: string }).error };
  }
  return { data: data as T, error: null };
}
