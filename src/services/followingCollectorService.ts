import { InstagramService } from '@/api/services/InstagramService';
import { BenchmarkCreate } from '@/api';

export interface FollowingCollectorOptions {
  scrollDelay?: number;
  pageLoadDelay?: number;
  onProgress?: (current: number, total: number, status: string) => void;
}

export interface FollowingCollectorResult {
  success: boolean;
  collectedCount: number;
  following: string[];
  error?: string;
}

export class FollowingCollectorService {
  private webviewApi: any;
  private instagramUsername: string;
  private options: { scrollDelay: number; pageLoadDelay: number; onProgress?: (current: number, total: number, status: string) => void };

  constructor(
    webviewApi: any,
    instagramUsername: string,
    options: FollowingCollectorOptions = {}
  ) {
    this.webviewApi = webviewApi;
    this.instagramUsername = instagramUsername;
    this.options = {
      scrollDelay: options.scrollDelay || 1000,
      pageLoadDelay: options.pageLoadDelay || 3000,
      onProgress: options.onProgress
    };
  }

  async collectFollowing(): Promise<FollowingCollectorResult> {
    try {
      const profileUrl = `https://www.instagram.com/${this.instagramUsername}`;
      console.log('[Following Collection] Navigating to profile:', profileUrl);

      // Navigate to profile using direct script execution
      await this.navigateToProfile(profileUrl);

      console.log('[Following Collection] Waiting for page load...');
      this.options.onProgress?.(0, 0, 'Waiting for page load...');
      await this.delay(this.options.pageLoadDelay);
      await this.delay(2000);

      console.log('[Following Collection] Opening following modal...');
      this.options.onProgress?.(0, 0, 'Opening following modal...');
      const followingClicked = await this.webviewApi.clickFollowing();
      console.log('[Following Collection] Following button clicked:', followingClicked);

      if (!followingClicked) {
        console.log('[Following Collection] Trying alternative method to find following button...');
        const alternativeResult = await this.webviewApi.executeScript(`
          (() => {
            try {
              const followingElements = Array.from(document.querySelectorAll('*')).filter(el => {
                const text = el.textContent || '';
                return text.includes('following') && !text.includes('followers');
              });
              if (followingElements.length > 0) {
                for (let element of followingElements) {
                  let parent = element as HTMLElement | null;
                  for (let i = 0; i < 5 && parent; i++) {
                    const tn = parent.tagName;
                    if (tn === 'A' || tn === 'BUTTON' || (parent as any).onclick) {
                      (parent as HTMLElement).click();
                      return true;
                    }
                    parent = parent.parentElement;
                  }
                }
              }
              return false;
            } catch (e) { return false; }
          })();
        `);

        if (!alternativeResult) {
          throw new Error('Failed to open following modal');
        }
      }

      console.log('[Following Collection] Waiting for page/modal to load...');
      await this.delay(3000);

      const currentUrl = await this.webviewApi.executeScript(`(() => { try { return window.location.href; } catch (e) { return ''; } })();`);
      console.log('[Following Collection] Current URL after following click:', currentUrl);
      if (currentUrl && currentUrl.includes('/following/')) {
        console.log('[Following Collection] Detected following page, waiting for content...');
        await this.delay(2000);
      }

      const following = await this.collectFollowingFromModal();

      if (following.length > 0) {
        await this.createBenchmarksForUsernames(following);
      }

      return { success: true, collectedCount: following.length, following };
    } catch (error) {
      console.error('[Following Collection] Error:', error);
      return { success: false, collectedCount: 0, following: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async collectFollowingFromModal(): Promise<string[]> {
    const following: string[] = [];
    let unchangedScrolls = 0;
    const maxUnchangedScrolls = 5; // Reduced for faster completion
    let prevSnapshot = '';

    console.log('[Following Collection] Starting following collection...');

    while (unchangedScrolls < maxUnchangedScrolls) {
      console.log(`[Following Collection] Current following: ${following.length}`);

      try {
        await this.delay(1000);

        const snapshotUsernames = await this.extractUsernamesFromFollowingModal();
        const currentSnapshot = snapshotUsernames.slice(0, 100).join('|');
        if (currentSnapshot === prevSnapshot) {
          unchangedScrolls++;
          console.log(`[Following Collection] No change detected in list (${unchangedScrolls}/5)`);
        } else {
          unchangedScrolls = 0;
          prevSnapshot = currentSnapshot;
        }

        let addedCount = 0;
        for (const username of snapshotUsernames) {
          if (!following.includes(username)) {
            following.push(username);
            addedCount++;
          }
        }
        console.log(`[Following Collection] Added ${addedCount} new following. Total: ${following.length}`);
        if (addedCount > 0) {
          this.options.onProgress?.(following.length, following.length, `Collected ${following.length} following...`);
        }

        console.log('[Following Collection] Scrolling down...');
        this.options.onProgress?.(following.length, following.length, 'Scrolling to load more...');
        const scrolled = await this.webviewApi.scrollForemost(1000);
        if (!scrolled) {
          console.log('[Following Collection] Cannot scroll further');
          break;
        }

        console.log('[Following Collection] Waiting for new content to load...');
        await this.delay(this.options.scrollDelay + 1000);
      } catch (error) {
        console.error('[Following Collection] Error during collection:', error);
        unchangedScrolls++;
      }
    }

    console.log(`[Following Collection] Collection completed. Total: ${following.length} following`);
    return following;
  }

  private async extractUsernamesFromFollowingModal(): Promise<string[]> {
    try {
      const result = await this.webviewApi.executeScript(`(function(){
        try {
          var doc = document;
          var dialog = doc.querySelector('[role="dialog"], [aria-modal="true"]');
          var root = dialog || doc;
          var anchors = root.querySelectorAll('a');
          var list = [];
          for (var i=0; i<anchors.length; i++) {
            var a = anchors[i];
            var href = '';
            try { href = a.getAttribute('href') || a.href || ''; } catch (e) {}
            var text = '';
            try { text = (a.innerText || a.textContent || '').trim(); } catch (e) {}
            list.push({ href: href, text: text });
          }
          return JSON.stringify({ list: list.slice(0, 1000), count: anchors.length, inDialog: !!dialog, url: (window.location && window.location.href) || '' });
        } catch (e) {
          return JSON.stringify({ __error: (e && e.message) ? e.message : String(e) });
        }
      })();`);

      const RESERVED = new Set([
        'explore','accounts','about','privacy','terms','policies','legal',
        'reels','reel','channels','stories','tv','directory','web','graphql',
        'developer','business','ads','press','blog','api','help','sessions',
        'direct','p'
      ]);

      let anchors: { href: string; text: string }[] = [];
      try {
        const parsed = JSON.parse(result || '{}');
        if (parsed && parsed.__error) {
          console.error('[Following Collection] Extract script error:', parsed.__error);
          return [];
        }
        anchors = (parsed && parsed.list) || [];
        if (parsed) {
          const sample = anchors.slice(0, 5);
          console.log('[Following Collection] Extract debug:', { totalAnchors: parsed.count, inDialog: parsed.inDialog, url: parsed.url, sample });
        }
      } catch (e) {
        console.error('[Following Collection] Error parsing anchor list:', e);
        return [];
      }

      const usernamesSet = new Set<string>();
      for (const item of anchors) {
        const raw = (item.href || '').trim();
        if (!raw) continue;
        if (raw.startsWith('#') || raw.startsWith('javascript:')) continue;
        let url: URL | null = null;
        try {
          const base = 'https://www.instagram.com/';
          url = new URL(raw, base);
        } catch { continue; }
        const path = (url && url.pathname) || '';
        const m = path.match(/^\/([A-Za-z0-9._]{1,30})\/?$/);
        if (!m) continue;
        const candidate = (m[1] || '').toLowerCase();
        if (!candidate || RESERVED.has(candidate)) continue;
        usernamesSet.add(candidate);
      }

      const usernames = Array.from(usernamesSet);
      console.log('[Following Collection] Extracted usernames:', usernames);
      return usernames;
    } catch (error) {
      console.error('[Following Collection] Error extracting usernames:', error);
      return [];
    }
  }

  private async createBenchmarksForUsernames(usernames: string[]): Promise<void> {
    try {
      console.log('[Following Collection] Creating benchmarks from collected usernames...');

      const me = (this.instagramUsername || '').toLowerCase();
      const unique = Array.from(new Set(usernames.map(u => (u || '').toLowerCase())));
      const filtered = unique.filter(u => u && u !== me);

      let created = 0;
      for (const igu of filtered) {
        try {
          const createData: BenchmarkCreate = { ig_username: igu };
          const benchmark = await InstagramService.createBenchmarkApiV1InstagramBenchmarksPost(createData);
          created++;
          this.options.onProgress?.(created, filtered.length, `Created ${created}/${filtered.length} benchmarks...`);
          console.log(`[Following Collection] Created benchmark for @${igu}: ${benchmark.id}`);
          await this.delay(100);
        } catch (e) {
          console.error(`[Following Collection] Failed to create benchmark for @${igu}:`, e);
          // Continue with others
        }
      }
      console.log(`[Following Collection] Finished creating benchmarks. Success: ${created}/${filtered.length}`);
    } catch (error) {
      console.error('[Following Collection] Error creating benchmarks:', error);
      // Surface but do not throw to avoid failing the overall collection
    }
  }

  private async navigateToProfile(profileUrl: string): Promise<void> {
    try {
      console.log('[Following Collection] Executing navigation script...');
      await this.webviewApi.executeScript(`
        (() => {
          try {
            window.location.href = '${profileUrl}';
            return true;
          } catch (e) { 
            console.error('Navigation error:', e);
            return false; 
          }
        })();
      `);
      
      // Wait for navigation to complete
      await this.delay(2000);
      console.log('[Following Collection] Navigation completed');
    } catch (error) {
      console.error('[Following Collection] Navigation error:', error);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Convenience function for easy usage
export async function collectFollowingToBenchmark(
  webviewApi: any,
  instagramUsername: string,
  options?: FollowingCollectorOptions
): Promise<FollowingCollectorResult> {
  const service = new FollowingCollectorService(webviewApi, instagramUsername, options);
  return service.collectFollowing();
}
