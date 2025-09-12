import { describe, it, expect } from 'vitest';
import { extractMostRecentProfile } from './instagramDom';

describe('instagramDom.extractMostRecentProfile', () => {
  it('extracts the first username-like anchor from DOM', () => {
    document.body.innerHTML = `
      <div>
        <a href="/recent_user/">recent_user</a>
        <a href="/another_user/">another_user</a>
        <a href="/p/ABC123/">post</a>
      </div>
    `;

    const username = extractMostRecentProfile(document);
    expect(username).toBe('recent_user');
  });

  it('returns null if no profile-like links', () => {
    document.body.innerHTML = `
      <div>
        <a href="/p/ABC123/">post</a>
      </div>
    `;
    const username = extractMostRecentProfile(document);
    expect(username).toBeNull();
  });
});

