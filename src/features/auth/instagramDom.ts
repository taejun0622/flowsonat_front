// Extract the most recent profile from the current Instagram DOM.
// Adjust selectors to match the automation you already use.
export function extractMostRecentProfile(doc: Document): string | null {
  const anchors = Array.from(doc.querySelectorAll('a[href^="/"]'));

  // Instagram reserved top-level paths to exclude from username candidates
  const RESERVED = new Set([
    'p',
    'explore',
    'accounts',
    'direct',
    'stories',
    'reels',
    'tv',
    'about',
    'developer',
    'terms',
    'privacy',
    'help',
    'challenge',
    'web',
    'graphql',
    'api',
    'business',
    'press',
    'blog',
    'directory',
    'locations',
    'tags',
    'topics',
    'login',
    'oauth',
  ]);

  // Username heuristic: 1-30 of [a-z0-9._], not reserved
  const USERNAME_RE = /^[a-z0-9._]{1,30}$/i;

  const usernames = anchors
    .map((a) => a.getAttribute('href')?.split('/').filter(Boolean)[0] ?? null)
    .filter((seg): seg is string => !!seg)
    .filter((seg) => !RESERVED.has(seg.toLowerCase()))
    .filter((seg) => USERNAME_RE.test(seg));

  return usernames[0] ?? null;
}
