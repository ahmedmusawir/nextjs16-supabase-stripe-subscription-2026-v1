/**
 * Validates a `next` parameter value for safe use as a redirect target.
 * Returns the validated path, or null if invalid.
 *
 * Validation rules (per APP_BRIEF Section 21):
 *   1. Must be a non-empty string
 *   2. Must start with "/"
 *   3. Must NOT start with "//" (rejects protocol-relative URLs)
 *   4. Must NOT contain ":" (rejects schemed URLs)
 *   5. Must NOT contain "\" (defense-in-depth)
 */
export function safeRedirect(
  next: string | null | undefined
): string | null {
  if (!next || typeof next !== 'string') return null;
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//')) return null;
  if (next.includes(':')) return null;
  if (next.includes('\\')) return null;
  return next;
}
