import { InstagramService } from '@/api/services/InstagramService';
import { BenchmarkCreate, BulkTargetCreate, TargetCreate } from '@/api';

export interface FollowingCollectionOptions {
  scrollDelay?: number;
  pageLoadDelay?: number;
  onProgress?: (current: number, total: number, status: string) => void;
}

export interface FollowingCollectionResult {
  success: boolean;
  collectedCount: number;
  following: string[];
  error?: string;
}

export class FollowingCollectionService {
  private webviewApi: any;
  private instagramUsername: string;
  private options: { scrollDelay: number; pageLoadDelay: number; onProgress?: (current: number, total: number, status: string) => void };

  constructor(
    webviewApi: any, 
    instagramUsername: string, 
    options: FollowingCollectionOptions = {}
  ) {
    this.webviewApi = webviewApi;
    this.instagramUsername = instagramUsername;
    this.options = {
      scrollDelay: options.scrollDelay || 1000,
      pageLoadDelay: options.pageLoadDelay || 3000,
      onProgress: options.onProgress
    };
  }

  async collectFollowing(): Promise<FollowingCollectionResult> {
    try {
      // 1. Navigate to user's profile
      const profileUrl = `https://www.instagram.com/${this.instagramUsername}`;
      console.log('[Following Collection] Navigating to profile:', profileUrl);
      
      // Navigate to profile using direct script execution
      await this.navigateToProfile(profileUrl);
      
      // 2. Wait for page load and ensure WebView is ready
      console.log('[Following Collection] Waiting for page load...');
      this.options.onProgress?.(0, 0, 'Waiting for page load...');
      await this.delay(this.options.pageLoadDelay);
      
      // Additional wait to ensure DOM is fully loaded
      await this.delay(2000);
      
      // 3. Click following button (not followers!)
      console.log('[Following Collection] Opening following modal...');
      this.options.onProgress?.(0, 0, 'Opening following modal...');
      const followingClicked = await this.webviewApi.clickFollowing();
      console.log('[Following Collection] Following button clicked:', followingClicked);
      
      if (!followingClicked) {
        // Try alternative method to find following button
        console.log('[Following Collection] Trying alternative method to find following button...');
        const alternativeResult = await this.webviewApi.executeScript(`
          (() => {
            try {
              // Look for following count text
              const followingElements = Array.from(document.querySelectorAll('*')).filter(el => {
                const text = el.textContent || '';
                return text.includes('following') && !text.includes('followers');
              });
              
              if (followingElements.length > 0) {
                // Find the clickable parent
                for (let element of followingElements) {
                  let parent = element;
                  for (let i = 0; i < 5; i++) {
                    if (parent.tagName === 'A' || parent.tagName === 'BUTTON' || parent.onclick) {
                      parent.click();
                      return true;
                    }
                    parent = parent.parentElement;
                    if (!parent) break;
                  }
                }
              }
              return false;
            } catch (e) {
              return false;
            }
          })();
        `);
        
        if (!alternativeResult) {
          throw new Error('Failed to open following modal');
        }
      }
      
      // 4. Wait for page/modal to load
      console.log('[Following Collection] Waiting for page/modal to load...');
      await this.delay(3000); // Increased wait time
      
      // 5. Check if we're on a following page or in a modal
      const currentUrl = await this.webviewApi.executeScript(`
        (() => {
          try {
            return window.location.href;
          } catch (e) {
            return '';
          }
        })();
      `);
      
      console.log('[Following Collection] Current URL after following click:', currentUrl);
      
      // If we're on a following page, we need to wait a bit more for content to load
      if (currentUrl && currentUrl.includes('/following/')) {
        console.log('[Following Collection] Detected following page, waiting for content...');
        await this.delay(2000);
      }
      
      // 5. Start collecting following
      const following = await this.collectFollowingFromModal();
      
      // 6. Create benchmark with collected following
      if (following.length > 0) {
        await this.createBenchmark(following);
      }
      
      return {
        success: true,
        collectedCount: following.length,
        following
      };
      
    } catch (error) {
      console.error('[Following Collection] Error:', error);
      return {
        success: false,
        collectedCount: 0,
        following: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async collectFollowingFromModal(): Promise<string[]> {
    const following: string[] = [];
    let unchangedScrolls = 0;
    const maxUnchangedScrolls = 5; // Stop if list doesn't change for 5 scrolls
    let scrollAttempts = 0;
    const maxScrollAttempts = 1000; // Prevent infinite loops
    let prevSnapshot = '';

    console.log('[Following Collection] Starting following collection...');

    while (
      unchangedScrolls < maxUnchangedScrolls &&
      scrollAttempts < maxScrollAttempts
    ) {
      scrollAttempts++;
      console.log(`[Following Collection] Attempt ${scrollAttempts}: Current following: ${following.length}`);

      try {
        // Wait a bit before extracting to ensure content is loaded
        await this.delay(1000);

        // Extract usernames from current view
        const snapshotUsernames = await this.extractUsernamesFromFollowingModal();

        // Snapshot for change detection (first 100 items for stability)
        const currentSnapshot = snapshotUsernames.slice(0, 100).join('|');
        if (currentSnapshot === prevSnapshot) {
          unchangedScrolls++;
          console.log(
            `[Following Collection] No change detected in list (${unchangedScrolls}/${maxUnchangedScrolls})`
          );
        } else {
          unchangedScrolls = 0;
          prevSnapshot = currentSnapshot;
        }

        // Add only usernames not already collected
        let addedCount = 0;
        for (const username of snapshotUsernames) {
          if (!following.includes(username)) {
            following.push(username);
            addedCount++;
          }
        }
        console.log(
          `[Following Collection] Added ${addedCount} new following. Total: ${following.length}`
        );
        if (addedCount > 0) {
          this.options.onProgress?.(
            following.length,
            following.length,
            `Collected ${following.length} following...`
          );
        }

        // Scroll down to load more
        console.log('[Following Collection] Scrolling down...');
        this.options.onProgress?.(following.length, following.length, 'Scrolling to load more...');
        const scrolled = await this.webviewApi.scrollForemost(1000); // Increased scroll distance
        if (!scrolled) {
          console.log('[Following Collection] Cannot scroll further');
          break;
        }

        // Wait for new content to load
        console.log('[Following Collection] Waiting for new content to load...');
        await this.delay(this.options.scrollDelay + 1000); // Extra wait time
      } catch (error) {
        console.error('[Following Collection] Error during collection:', error);
        unchangedScrolls++;
      }
    }

    console.log(
      `[Following Collection] Collection completed. Total: ${following.length} following`
    );
    return following;
  }

  private async extractUsernamesFromFollowingModal(): Promise<string[]> {
    try {
      // Step 1: Collect anchors from the following dialog/page (pure DOM access only)
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

      // Step 2: Parse anchors client-side and normalize into usernames
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
          // Normalize possibly relative URLs against IG origin
          const base = 'https://www.instagram.com/';
          url = new URL(raw, base);
        } catch {
          continue;
        }
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

  private async createBenchmark(following: string[]): Promise<void> {
    try {
      console.log('[Following Collection] Creating benchmark...');
      
      // 1. Create benchmark for the user's account
      const createData: BenchmarkCreate = {
        ig_username: this.instagramUsername
      };
      
      const benchmark = await InstagramService.createBenchmarkApiV1InstagramBenchmarksPost(createData);
      console.log(`[Following Collection] Created benchmark: ${benchmark.id}`);
      
      // 2. Add following as targets using Bulk API
      console.log(`[Following Collection] Adding ${following.length} following as targets...`);
      let addedTargets = 0;
      
      // Process targets in batches to avoid overwhelming the API
      const batchSize = 50; // Process 50 targets at a time
      const batches = [];
      
      for (let i = 0; i < following.length; i += batchSize) {
        batches.push(following.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        try {
          const bulkTargetData: BulkTargetCreate = {
            targets: batch.map(username => ({ ig_username: username }))
          };
          
          await InstagramService.createBulkTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsBulkPost(
            benchmark.id,
            bulkTargetData
          );
          
          addedTargets += batch.length;
          this.options.onProgress?.(addedTargets, following.length, `Added ${addedTargets} targets...`);
          
          console.log(`[Following Collection] Created ${batch.length} targets in bulk`);
          
          // Small delay between batches to avoid overwhelming the API
          await this.delay(200);
          
        } catch (error) {
          console.error(`[Following Collection] Bulk target creation failed, falling back to individual creation:`, error);
          
          // Fallback to individual creation if bulk fails
          for (const followingUsername of batch) {
            try {
              const targetData = {
                ig_username: followingUsername
              };
              
              await InstagramService.createTargetApiV1InstagramBenchmarksBenchmarkIdTargetsPost(
                benchmark.id,
                targetData
              );
              
              addedTargets++;
              this.options.onProgress?.(addedTargets, following.length, `Added ${addedTargets} targets...`);
              
              // Small delay to avoid overwhelming the API
              await this.delay(100);
              
            } catch (individualError) {
              console.error(`[Following Collection] Error adding target ${followingUsername}:`, individualError);
              // Continue with other targets even if one fails
            }
          }
        }
      }
      
      console.log(`[Following Collection] Successfully created benchmark with ${addedTargets} targets!`);
      
    } catch (error) {
      console.error('[Following Collection] Error creating benchmark:', error);
      throw error;
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
export async function addMyFollowingToBenchmark(
  webviewApi: any,
  instagramUsername: string,
  options?: FollowingCollectionOptions
): Promise<FollowingCollectionResult> {
  const service = new FollowingCollectionService(webviewApi, instagramUsername, options);
  return service.collectFollowing();
}
