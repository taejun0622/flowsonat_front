import { InstagramService } from '@/api/services/InstagramService';
import { BenchmarkResponse, TargetResponse, FollowResponse, StageEnum, HealthEnum, StatusEnum, BulkTargetCreate, TargetCreate, BulkFollowRequest1, BulkFollowRequest2, SuggestionCreate } from '@/api';
import { ProfileCollectionService } from './profileCollectionService';

export interface AutomationOptions {
  scrollDelay?: number;
  pageLoadDelay?: number;
  onProgress?: (current: number, total: number, status: string) => void;
  onAction?: (action: string, target: string, result: boolean) => void;
}

export interface AutomationResult {
  success: boolean;
  actionsPerformed: number;
  targetsProcessed: string[];
  errors: string[];
  executionTime: number;
  stage: 'profile_collection' | 'unfollow' | 'target_collection' | 'follow' | 'suggestion_collection' | 'completed';
  details: {
    followersCollected?: number;
    followingCollected?: number;
    unfollowedCount?: number;
    targetsCollected?: number;
    followedCount?: number;
    suggestionsCollected?: number;
  };
}

export interface AutomationAction {
  type: 'follow' | 'unfollow' | 'like' | 'comment' | 'visit';
  target: string;
  parameters?: Record<string, any>;
}

export class AutomationService {
  private webviewApi: any;
  private instagramUsername: string;
  private benchmark: BenchmarkResponse;
  private profileCollectionService: ProfileCollectionService;
  private options: {
    scrollDelay: number;
    pageLoadDelay: number;
    onProgress?: (current: number, total: number, status: string) => void;
    onAction?: (action: string, target: string, result: boolean) => void;
  };

  constructor(
    webviewApi: any,
    instagramUsername: string,
    benchmark: BenchmarkResponse,
    options: AutomationOptions = {}
  ) {
    this.webviewApi = webviewApi;
    this.instagramUsername = instagramUsername;
    this.benchmark = benchmark;
    this.profileCollectionService = new ProfileCollectionService(webviewApi);
    this.options = {
      scrollDelay: options.scrollDelay || 1000,
      pageLoadDelay: options.pageLoadDelay || 3000,
      onProgress: options.onProgress,
      onAction: options.onAction
    };
  }

  async executeAutomation(): Promise<AutomationResult> {
    const startTime = Date.now();
    const targetsProcessed: string[] = [];
    const errors: string[] = [];
    let actionsPerformed = 0;
    const details: AutomationResult['details'] = {};

    try {
      this.options.onProgress?.(0, 0, 'Starting workflow automation...');
      
      // Stage 1: Profile Collection (Followers & Following)
      this.options.onProgress?.(0, 5, 'Stage 1: Collecting profile information...');
      const profileResult = await this.collectProfileInformation();
      details.followersCollected = profileResult.followersCollected;
      details.followingCollected = profileResult.followingCollected;
      
      // Stage 2: Unfollow
      this.options.onProgress?.(1, 5, 'Stage 2: Processing unfollows...');
      const unfollowResult = await this.processUnfollows();
      details.unfollowedCount = unfollowResult.unfollowedCount;
      
      // Stage 3: Target Collection
      this.options.onProgress?.(2, 5, 'Stage 3: Collecting targets...');
      const targetResult = await this.collectTargets();
      details.targetsCollected = targetResult.targetsCollected;
      
      // Stage 4: Follow
      this.options.onProgress?.(3, 5, 'Stage 4: Processing follows...');
      const followResult = await this.processFollows();
      details.followedCount = followResult.followedCount;
      
      // Stage 5: Suggestion Collection
      this.options.onProgress?.(4, 5, 'Stage 5: Collecting suggestions...');
      const suggestionResult = await this.collectSuggestions();
      details.suggestionsCollected = suggestionResult.suggestionsCollected;
      
      // Stage 6: Complete
      this.options.onProgress?.(5, 5, 'Workflow completed successfully!');
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        actionsPerformed: (details.followersCollected || 0) + (details.followingCollected || 0) + (details.unfollowedCount || 0) + (details.targetsCollected || 0) + (details.followedCount || 0) + (details.suggestionsCollected || 0),
        targetsProcessed,
        errors,
        executionTime,
        stage: 'completed',
        details
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMsg = `Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      
      return {
        success: false,
        actionsPerformed,
        targetsProcessed,
        errors,
        executionTime,
        stage: 'completed',
        details
      };
    }
  }

  private async getTargetsFromBenchmark(): Promise<string[]> {
    try {
      // Get targets from benchmark data
      // This could be followers, following, or other target lists
      const targets: string[] = [];
      
      // Example: Get following from benchmark
      // You can modify this based on your benchmark structure
      if (this.benchmark.ig && this.benchmark.ig.username) {
        // For now, return the benchmark username as a target
        // In real implementation, you might get a list of users to interact with
        targets.push(this.benchmark.ig.username);
      }
      
      return targets;
    } catch (error) {
      console.error('[Automation] Error getting targets:', error);
      return [];
    }
  }

  private async executeActionOnTarget(target: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Navigate to target profile
      const profileUrl = `https://www.instagram.com/${target}`;
      await this.navigateToProfile(profileUrl);
      
      // Wait for page load
      await this.delay(this.options.pageLoadDelay);
      
      // Execute specific action based on automation type
      const actionResult = await this.performAction(target);
      
      return { success: actionResult };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async navigateToProfile(profileUrl: string): Promise<void> {
    try {
      // Use WebView API to navigate
      if (this.webviewApi && this.webviewApi.executeScript) {
        await this.webviewApi.executeScript(`
          (() => {
            try {
              window.location.href = '${profileUrl}';
              return true;
            } catch (e) {
              return false;
            }
          })();
        `);
      }

      // Wait for page to load
      await this.delay(this.options.pageLoadDelay);

      // Collect profile information and send to history API
      try {
        console.log('[Automation] Collecting profile information for history...');
        const result = await this.profileCollectionService.collectAndSendProfileHistory();
        
        if (result.success) {
          console.log('[Automation] Successfully collected and sent profile history');
          this.options.onAction?.('profile_history_collected', profileUrl, true);
        } else {
          console.warn('[Automation] Failed to collect profile history:', result.error);
          this.options.onAction?.('profile_history_failed', profileUrl, false);
        }
      } catch (historyError) {
        console.error('[Automation] Error collecting profile history:', historyError);
        this.options.onAction?.('profile_history_error', profileUrl, false);
      }

    } catch (error) {
      console.error('[Automation] Navigation error:', error);
      throw error;
    }
  }

  private async performAction(target: string): Promise<boolean> {
    try {
      // Example action: Follow the user
      // You can modify this based on your automation requirements
      
      // Check if already following
      const isFollowing = await this.checkIfFollowing();
      
      if (!isFollowing) {
        // Click follow button
        const followClicked = await this.clickFollowButton();
        if (followClicked) {
          this.options.onAction?.('follow', target, true);
          return true;
        } else {
          this.options.onAction?.('follow', target, false);
          return false;
        }
      } else {
        this.options.onAction?.('already_following', target, true);
        return true;
      }
    } catch (error) {
      console.error('[Automation] Action error:', error);
      return false;
    }
  }

  private async checkIfFollowing(): Promise<boolean> {
    try {
      const result = await this.webviewApi.executeScript(`
        (() => {
          try {
            const followButton = document.querySelector('button[type="button"]');
            if (followButton) {
              const buttonText = followButton.textContent || '';
              return buttonText.toLowerCase().includes('following') || 
                     buttonText.toLowerCase().includes('requested');
            }
            return false;
          } catch (e) {
            return false;
          }
        })();
      `);
      
      return Boolean(result);
    } catch (error) {
      console.error('[Automation] Check following error:', error);
      return false;
    }
  }

  private async clickFollowButton(): Promise<boolean> {
    try {
      const result = await this.webviewApi.executeScript(`
        (() => {
          try {
            const followButton = document.querySelector('button[type="button"]');
            if (followButton && !followButton.textContent.toLowerCase().includes('following')) {
              followButton.click();
              return true;
            }
            return false;
          } catch (e) {
            return false;
          }
        })();
      `);
      
      return Boolean(result);
    } catch (error) {
      console.error('[Automation] Click follow error:', error);
      return false;
    }
  }

  // Stage 1: Profile Collection
  private async collectProfileInformation(): Promise<{ followersCollected: number; followingCollected: number }> {
    try {
      this.options.onProgress?.(0, 2, 'Collecting followers...');
      
      // Navigate to profile
      const profileUrl = `https://www.instagram.com/${this.instagramUsername}`;
      await this.navigateToProfile(profileUrl);
      await this.delay(this.options.pageLoadDelay);
      
      // Collect followers
      const followersCollected = await this.collectFollowers();
      
      this.options.onProgress?.(1, 2, 'Collecting following...');
      
      // Collect following
      const followingCollected = await this.collectFollowing();
      
      return { followersCollected, followingCollected };
    } catch (error) {
      console.error('[Automation] Profile collection error:', error);
      return { followersCollected: 0, followingCollected: 0 };
    }
  }

  // Stage 2: Unfollow
  private async processUnfollows(): Promise<{ unfollowedCount: number }> {
    try {
      // Get REQUESTED targets that are 4+ days old
      const targets = await this.getRequestedTargets();
      let unfollowedCount = 0;
      
      for (const target of targets) {
        try {
          const profileUrl = `https://www.instagram.com/${target.ig.username}`;
          await this.navigateToProfile(profileUrl);
          await this.delay(this.options.pageLoadDelay);
          
          // Check if unfollow button exists and click it
          const unfollowed = await this.clickUnfollowButton();
          if (unfollowed) {
            // Update target stage to UNFOLLOWED
            await InstagramService.updateTargetApiV1InstagramTargetsTargetIdPut(target.id, {
              stage: StageEnum.UNFOLLOWED
            });
            unfollowedCount++;
            this.options.onAction?.('unfollow', target.ig.username, true);
          }
          
          await this.delay(this.options.scrollDelay);
        } catch (error) {
          console.error(`[Automation] Unfollow error for ${target.ig.username}:`, error);
        }
      }
      
      return { unfollowedCount };
    } catch (error) {
      console.error('[Automation] Unfollow processing error:', error);
      return { unfollowedCount: 0 };
    }
  }

  // Stage 3: Target Collection
  private async collectTargets(): Promise<{ targetsCollected: number }> {
    try {
      // Initial check if we have less than 400 PENDING targets
      const initialPendingTargets = await this.getPendingTargets();
      
      if (initialPendingTargets.length >= 400) {
        this.options.onProgress?.(0, 1, 'Skipping target collection (400+ pending targets)');
        return { targetsCollected: 0 };
      }
      
      // Get healthy benchmarks
      const benchmarks = await this.getHealthyBenchmarks();
      let targetsCollected = 0;
      
      // Shuffle benchmarks array to randomize processing order
      const shuffledBenchmarks = this.shuffleArray([...benchmarks]);
      
      for (const benchmark of shuffledBenchmarks) {
        try {
          // Check 400+ limit before processing each benchmark
          const currentPendingTargets = await this.getPendingTargets();
          if (currentPendingTargets.length >= 400) {
            console.log(`[Automation] Reached 400+ pending targets (${currentPendingTargets.length}), stopping target collection`);
            this.options.onProgress?.(targetsCollected, targetsCollected, `Target collection stopped (400+ pending targets)`);
            break;
          }
          
          const profileUrl = `https://www.instagram.com/${benchmark.ig.username}`;
          await this.navigateToProfile(profileUrl);
          await this.delay(this.options.pageLoadDelay);
          
          // Check if follow button exists
          const canFollow = await this.checkIfCanFollow();
          
          if (canFollow) {
            // Collect followers from this profile
            const followers = await this.collectFollowersFromProfile(benchmark.ig.username);
            
            // Create targets from followers using Bulk API (no limit for target creation)
            if (followers.length > 0) {
              try {
                const bulkTargetData: BulkTargetCreate = {
                  targets: followers.map(follower => ({ ig_username: follower }))
                };
                
                await InstagramService.createBulkTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsBulkPost(
                  benchmark.id,
                  bulkTargetData
                );
                
                targetsCollected += followers.length;
                console.log(`[Automation] Created ${followers.length} targets in bulk`);
                
                // Check 400+ limit after bulk creation
                const afterBulkPendingTargets = await this.getPendingTargets();
                if (afterBulkPendingTargets.length >= 400) {
                  console.log(`[Automation] Reached 400+ pending targets (${afterBulkPendingTargets.length}) after bulk creation, stopping target collection`);
                  this.options.onProgress?.(targetsCollected, targetsCollected, `Target collection stopped (400+ pending targets)`);
                  break;
                }
              } catch (error) {
                console.error(`[Automation] Bulk target creation failed, trying smaller batches:`, error);
                
                // Try smaller batches if bulk fails
                const batchSize = 10;
                for (let i = 0; i < followers.length; i += batchSize) {
                  // Check 400+ limit before each batch
                  const beforeBatchPendingTargets = await this.getPendingTargets();
                  if (beforeBatchPendingTargets.length >= 400) {
                    console.log(`[Automation] Reached 400+ pending targets (${beforeBatchPendingTargets.length}) before batch, stopping target collection`);
                    this.options.onProgress?.(targetsCollected, targetsCollected, `Target collection stopped (400+ pending targets)`);
                    return { targetsCollected };
                  }
                  
                  const batch = followers.slice(i, i + batchSize);
                  
                  try {
                    const batchData: BulkTargetCreate = {
                      targets: batch.map(follower => ({ ig_username: follower }))
                    };
                    
                    await InstagramService.createBulkTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsBulkPost(
                      benchmark.id,
                      batchData
                    );
                    
                    targetsCollected += batch.length;
                    console.log(`[Automation] Created ${batch.length} targets in smaller batch`);
                    
                    // Check 400+ limit after each batch
                    const afterBatchPendingTargets = await this.getPendingTargets();
                    if (afterBatchPendingTargets.length >= 400) {
                      console.log(`[Automation] Reached 400+ pending targets (${afterBatchPendingTargets.length}) after batch, stopping target collection`);
                      this.options.onProgress?.(targetsCollected, targetsCollected, `Target collection stopped (400+ pending targets)`);
                      return { targetsCollected };
                    }
                    
                    // Small delay between batches
                    await this.delay(100);
                  } catch (batchError) {
                    console.error(`[Automation] Batch creation failed, falling back to individual creation for batch:`, batchError);
                    
                    // Only fallback to individual for this specific batch
                    for (const follower of batch) {
                      // Check 400+ limit before each individual creation
                      const beforeIndividualPendingTargets = await this.getPendingTargets();
                      if (beforeIndividualPendingTargets.length >= 400) {
                        console.log(`[Automation] Reached 400+ pending targets (${beforeIndividualPendingTargets.length}) before individual creation, stopping target collection`);
                        this.options.onProgress?.(targetsCollected, targetsCollected, `Target collection stopped (400+ pending targets)`);
                        return { targetsCollected };
                      }
                      
                      try {
                        await InstagramService.createTargetApiV1InstagramBenchmarksBenchmarkIdTargetsPost(
                          benchmark.id,
                          { ig_username: follower }
                        );
                        targetsCollected++;
                      } catch (individualError) {
                        console.error(`[Automation] Failed to create target for ${follower}:`, individualError);
                      }
                    }
                  }
                }
              }
            }
          }
          
          await this.delay(this.options.scrollDelay);
        } catch (error) {
          console.error(`[Automation] Target collection error for ${benchmark.ig.username}:`, error);
        }
      }
      
      return { targetsCollected };
    } catch (error) {
      console.error('[Automation] Target collection error:', error);
      return { targetsCollected: 0 };
    }
  }

  // Stage 4: Follow
  private async processFollows(): Promise<{ followedCount: number }> {
    try {
      const targets = await this.getPendingTargets();
      const maxFollows = 400 - (await this.getUnfollowedCount());
      let followedCount = 0;
      
      for (const target of targets) {
        if (followedCount >= maxFollows) break;
        
        try {
          const profileUrl = `https://www.instagram.com/${target.ig.username}`;
          await this.navigateToProfile(profileUrl);
          await this.delay(this.options.pageLoadDelay);
          
          // Check if we can follow
          const canFollow = await this.checkIfCanFollow();
          const isFollowing = await this.checkIfFollowing();
          
          if (canFollow && !isFollowing) {
            const followed = await this.clickFollowButton();
            if (followed) {
              await InstagramService.updateTargetApiV1InstagramTargetsTargetIdPut(target.id, {
                stage: StageEnum.REQUESTED
              });
              followedCount++;
              this.options.onAction?.('follow', target.ig.username, true);
            }
          } else if (isFollowing) {
            await InstagramService.updateTargetApiV1InstagramTargetsTargetIdPut(target.id, {
              stage: StageEnum.FOLLOW_BACK
            });
            this.options.onAction?.('already_following', target.ig.username, true);
          }
          
          await this.delay(this.options.scrollDelay);
        } catch (error) {
          console.error(`[Automation] Follow error for ${target.ig.username}:`, error);
        }
      }
      
      return { followedCount };
    } catch (error) {
      console.error('[Automation] Follow processing error:', error);
      return { followedCount: 0 };
    }
  }

  // Stage 5: Suggestion Collection
  private async collectSuggestions(): Promise<{ suggestionsCollected: number }> {
    try {
      console.log('[Automation] Starting suggestion collection...');
      
      // Navigate to Instagram Suggested page
      const suggestedUrl = 'https://www.instagram.com/explore/people/suggested/';
      await this.navigateToProfile(suggestedUrl);
      await this.delay(this.options.pageLoadDelay);
      
      // Extract usernames from the Suggested page
      const usernames = await this.extractUsernamesFromSuggestedPage();
      
      console.log(`[Automation] Extracted ${usernames.length} usernames from Suggested page`);
      
      // Create suggestions using the API
      let suggestionsCollected = 0;
      for (const username of usernames) {
        try {
          const suggestionData: SuggestionCreate = {
            ig_username: username
          };
          
          await InstagramService.createSuggestionApiV1InstagramSuggestionsPost(suggestionData);
          suggestionsCollected++;
          this.options.onAction?.('suggestion_created', username, true);
          
          // Small delay between API calls
          await this.delay(100);
        } catch (error) {
          console.error(`[Automation] Failed to create suggestion for ${username}:`, error);
          this.options.onAction?.('suggestion_failed', username, false);
        }
      }
      
      console.log(`[Automation] Successfully created ${suggestionsCollected} suggestions`);
      return { suggestionsCollected };
    } catch (error) {
      console.error('[Automation] Suggestion collection error:', error);
      return { suggestionsCollected: 0 };
    }
  }

  // Helper methods
  private async collectFollowers(): Promise<number> {
    try {
      console.log('[Automation] Opening followers modal...');
      this.options.onProgress?.(0, 0, 'Opening followers modal...');
      
      // Open followers modal
      const followersClicked = await this.webviewApi.clickFollowers();
      if (!followersClicked) {
        throw new Error('Failed to open followers modal');
      }
      
      console.log('[Automation] Waiting for followers modal to load...');
      await this.delay(3000);
      
      // Collect usernames from modal with scrolling
      const followers = await this.collectUsernamesFromModalWithScroll();
      
      console.log(`[Automation] Collected ${followers.length} followers`);
      
      // Send followers to API using BulkFollowRequest1
      if (followers.length > 0) {
        await this.sendFollowersToAPI(followers);
      }
      
      return followers.length;
    } catch (error) {
      console.error('[Automation] Followers collection error:', error);
      return 0;
    }
  }

  private async collectFollowing(): Promise<number> {
    try {
      console.log('[Automation] Opening following modal...');
      this.options.onProgress?.(0, 0, 'Opening following modal...');
      
      // Open following modal
      const followingClicked = await this.webviewApi.clickFollowing();
      if (!followingClicked) {
        throw new Error('Failed to open following modal');
      }
      
      console.log('[Automation] Waiting for following modal to load...');
      await this.delay(3000);
      
      // Collect usernames from modal with scrolling
      const following = await this.collectUsernamesFromModalWithScroll();
      
      console.log(`[Automation] Collected ${following.length} following`);
      
      // Send following to API using BulkFollowRequest2
      if (following.length > 0) {
        await this.sendFollowingToAPI(following);
      }
      
      return following.length;
    } catch (error) {
      console.error('[Automation] Following collection error:', error);
      return 0;
    }
  }

  private async collectUsernamesFromModalWithScroll(): Promise<string[]> {
    const usernames: string[] = [];
    let unchangedScrolls = 0;
    const maxUnchangedScrolls = 5; // Reduced for faster completion
    let prevSnapshot = '';

    console.log('[Automation] Starting username collection with scrolling...');

    while (unchangedScrolls < maxUnchangedScrolls) {
      console.log(`[Automation] Current usernames: ${usernames.length}`);

      try {
        await this.delay(1000);

        // Extract usernames from current view
        const snapshotUsernames = await this.extractUsernamesFromModal();

        // Snapshot for change detection - use total count and last few items
        const currentSnapshot = `${snapshotUsernames.length}|${snapshotUsernames.slice(-20).join('|')}`;
        if (currentSnapshot === prevSnapshot) {
          unchangedScrolls++;
          console.log(`[Automation] No change detected in list (${unchangedScrolls}/${maxUnchangedScrolls})`);
        } else {
          unchangedScrolls = 0;
          prevSnapshot = currentSnapshot;
        }

        // Add only usernames not already collected
        let addedCount = 0;
        for (const username of snapshotUsernames) {
          if (!usernames.includes(username)) {
            usernames.push(username);
            addedCount++;
          }
        }
        console.log(`[Automation] Added ${addedCount} new usernames. Total: ${usernames.length}`);
        if (addedCount > 0) {
          this.options.onProgress?.(usernames.length, usernames.length, `Collected ${usernames.length} usernames...`);
        }

        // Scroll down to load more
        console.log('[Automation] Scrolling down...');
        this.options.onProgress?.(usernames.length, usernames.length, 'Scrolling to load more...');
        const scrolled = await this.webviewApi.scrollForemost(1000);
        if (!scrolled) {
          console.log('[Automation] Cannot scroll further');
          break;
        }

        // Wait for new content to load
        console.log('[Automation] Waiting for new content to load...');
        await this.delay(this.options.scrollDelay + 1000);
      } catch (error) {
        console.error('[Automation] Error during collection:', error);
        unchangedScrolls++;
      }
    }

    console.log(`[Automation] Collection completed. Total: ${usernames.length} usernames`);
    return usernames;
  }

  private async extractUsernamesFromModal(): Promise<string[]> {
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
          console.error('[Automation] Extract script error:', parsed.__error);
          return [];
        }
        anchors = (parsed && parsed.list) || [];
        if (parsed) {
          const sample = anchors.slice(0, 5);
          console.log('[Automation] Extract debug:', { totalAnchors: parsed.count, inDialog: parsed.inDialog, url: parsed.url, sample });
        }
      } catch (e) {
        console.error('[Automation] Error parsing anchor list:', e);
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
      console.log('[Automation] Extracted usernames:', usernames);
      return usernames;
    } catch (error) {
      console.error('[Automation] Error extracting usernames:', error);
      return [];
    }
  }

  private async getRequestedTargets(): Promise<TargetResponse[]> {
    try {
      // Get targets with REQUESTED stage and edited_at 4+ days ago
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      
      // For now, get all targets and filter manually
      // TODO: Implement proper API filtering when available
      const allTargets = await InstagramService.getTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsGet(
        this.benchmark.id,
        StageEnum.REQUESTED
      );
      
      // Handle new response schema - check if targets is directly an array or nested in a property
      let targetsArray: TargetResponse[] = [];
      if (Array.isArray(allTargets)) {
        targetsArray = allTargets;
      } else if (allTargets && Array.isArray(allTargets.targets)) {
        targetsArray = allTargets.targets;
      } else {
        console.warn('[Automation] Unexpected targets response format:', allTargets);
        return [];
      }
      
      const targets = targetsArray.filter((target: TargetResponse) => 
        target.updated_at && 
        new Date(target.updated_at) < fourDaysAgo
      );
      
      return targets;
    } catch (error) {
      console.error('[Automation] Get requested targets error:', error);
      return [];
    }
  }

  private async getPendingTargets(): Promise<TargetResponse[]> {
    try {
      const targets = await InstagramService.getTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsGet(
        this.benchmark.id,
        StageEnum.PENDING
      );
      
      // Handle new response schema - check if targets is directly an array or nested in a property
      if (Array.isArray(targets)) {
        return targets;
      } else if (targets && Array.isArray(targets.targets)) {
        return targets.targets;
      } else {
        console.warn('[Automation] Unexpected targets response format:', targets);
        return [];
      }
    } catch (error) {
      console.error('[Automation] Get pending targets error:', error);
      return [];
    }
  }

  private async getHealthyBenchmarks(): Promise<BenchmarkResponse[]> {
    try {
      const benchmarks = await InstagramService.getBenchmarksApiV1InstagramBenchmarksGet();
      
      // Handle new response schema - check if benchmarks is directly an array or nested in a property
      let benchmarksArray: BenchmarkResponse[] = [];
      if (Array.isArray(benchmarks)) {
        benchmarksArray = benchmarks;
      } else if (benchmarks && Array.isArray(benchmarks.benchmarks)) {
        benchmarksArray = benchmarks.benchmarks;
      } else {
        console.warn('[Automation] Unexpected benchmarks response format:', benchmarks);
        return [];
      }
      
      return benchmarksArray.filter(b => 
        b.health === HealthEnum.HEALTHY && b.status === StatusEnum.ACTIVE
      );
    } catch (error) {
      console.error('[Automation] Get healthy benchmarks error:', error);
      return [];
    }
  }

  private async getUnfollowedCount(): Promise<number> {
    try {
      const targets = await InstagramService.getTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsGet(
        this.benchmark.id,
        StageEnum.UNFOLLOWED
      );
      
      // Handle new response schema - check if targets is directly an array or nested in a property
      if (Array.isArray(targets)) {
        return targets.length;
      } else if (targets && Array.isArray(targets.targets)) {
        return targets.targets.length;
      } else {
        console.warn('[Automation] Unexpected targets response format:', targets);
        return 0;
      }
    } catch (error) {
      console.error('[Automation] Get unfollowed count error:', error);
      return 0;
    }
  }

  private async clickUnfollowButton(): Promise<boolean> {
    try {
      const result = await this.webviewApi.executeScript(`
        (() => {
          try {
            const unfollowButton = document.querySelector('button[type="button"]');
            if (unfollowButton && unfollowButton.textContent.toLowerCase().includes('unfollow')) {
              unfollowButton.click();
              return true;
            }
            return false;
          } catch (e) {
            return false;
          }
        })();
      `);
      
      return Boolean(result);
    } catch (error) {
      console.error('[Automation] Click unfollow error:', error);
      return false;
    }
  }

  private async checkIfCanFollow(): Promise<boolean> {
    try {
      const result = await this.webviewApi.executeScript(`
        (() => {
          try {
            const followButton = document.querySelector('button[type="button"]');
            if (followButton && followButton.textContent.toLowerCase().includes('follow')) {
              return true;
            }
            return false;
          } catch (e) {
            return false;
          }
        })();
      `);
      
      return Boolean(result);
    } catch (error) {
      console.error('[Automation] Check can follow error:', error);
      return false;
    }
  }

  private async collectFollowersFromProfile(username: string): Promise<string[]> {
    try {
      console.log(`[Automation] Opening followers modal for ${username}...`);
      
      // Open followers modal for this profile
      const followersClicked = await this.webviewApi.clickFollowers();
      if (!followersClicked) {
        console.log(`[Automation] Failed to open followers modal for ${username}`);
        return [];
      }
      
      await this.delay(3000);
      
      // Collect usernames with scrolling
      const followers = await this.collectUsernamesFromModalWithScroll();
      
      // Close modal
      await this.webviewApi.pressEscape();
      
      console.log(`[Automation] Collected ${followers.length} followers from ${username}`);
      return followers;
    } catch (error) {
      console.error('[Automation] Collect followers from profile error:', error);
      return [];
    }
  }

  /**
   * Send followers to API using BulkFollowRequest1
   * Multiple followers following one account (my account)
   */
  private async sendFollowersToAPI(followers: string[]): Promise<void> {
    try {
      console.log(`[Automation] Sending ${followers.length} followers to API...`);
      
      // Process in batches to avoid overwhelming the API
      const batchSize = 100; // Process 100 followers at a time
      const batches = [];
      
      for (let i = 0; i < followers.length; i += batchSize) {
        batches.push(followers.slice(i, i + batchSize));
      }
      
      let totalSent = 0;
      for (const batch of batches) {
        try {
          const bulkRequest: BulkFollowRequest1 = {
            follower_usernames: batch,
            following_username: this.instagramUsername
          };
          
          await InstagramService.updateBulkTargetStagesFollowersApiV1InstagramFollowBulkFollowersPost(
            bulkRequest
          );
          
          totalSent += batch.length;
          console.log(`[Automation] Sent ${batch.length} followers to API (${totalSent}/${followers.length})`);
          
          // Small delay between batches
          await this.delay(200);
          
        } catch (error) {
          console.error(`[Automation] Failed to send followers batch:`, error);
          // Continue with other batches even if one fails
        }
      }
      
      console.log(`[Automation] Successfully sent ${totalSent}/${followers.length} followers to API`);
      
    } catch (error) {
      console.error('[Automation] Error sending followers to API:', error);
    }
  }

  /**
   * Send following to API using BulkFollowRequest2
   * One follower (me) following multiple accounts
   */
  private async sendFollowingToAPI(following: string[]): Promise<void> {
    try {
      console.log(`[Automation] Sending ${following.length} following to API...`);
      
      // Process in batches to avoid overwhelming the API
      const batchSize = 100; // Process 100 following at a time
      const batches = [];
      
      for (let i = 0; i < following.length; i += batchSize) {
        batches.push(following.slice(i, i + batchSize));
      }
      
      let totalSent = 0;
      for (const batch of batches) {
        try {
          const bulkRequest: BulkFollowRequest2 = {
            follower_username: this.instagramUsername,
            following_usernames: batch
          };
          
          await InstagramService.updateBulkTargetStagesFollowingApiV1InstagramFollowBulkFollowingPost(
            bulkRequest
          );
          
          totalSent += batch.length;
          console.log(`[Automation] Sent ${batch.length} following to API (${totalSent}/${following.length})`);
          
          // Small delay between batches
          await this.delay(200);
          
        } catch (error) {
          console.error(`[Automation] Failed to send following batch:`, error);
          // Continue with other batches even if one fails
        }
      }
      
      console.log(`[Automation] Successfully sent ${totalSent}/${following.length} following to API`);
      
    } catch (error) {
      console.error('[Automation] Error sending following to API:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract usernames from Instagram Suggested page
   */
  private async extractUsernamesFromSuggestedPage(): Promise<string[]> {
    try {
      console.log('[Automation] Extracting usernames from Suggested page...');
      
      const result = await this.webviewApi.executeScript(`
        (function(){
          try {
            var usernames = [];
            var anchors = document.querySelectorAll('a[href*="/"]');
            
            for (var i = 0; i < anchors.length; i++) {
              var anchor = anchors[i];
              var href = anchor.getAttribute('href') || '';
              
              // Match Instagram profile URLs
              var match = href.match(/^\\/([A-Za-z0-9._]{1,30})\\/?$/);
              if (match) {
                var username = match[1].toLowerCase();
                
                // Filter out reserved usernames and common non-profile links
                var reserved = ['explore', 'accounts', 'about', 'privacy', 'terms', 'policies', 'legal', 
                              'reels', 'reel', 'channels', 'stories', 'tv', 'directory', 'web', 'graphql',
                              'developer', 'business', 'ads', 'press', 'blog', 'api', 'help', 'sessions',
                              'direct', 'p', 'suggested', 'people'];
                
                if (!reserved.includes(username) && username.length > 1) {
                  usernames.push(username);
                }
              }
            }
            
            // Remove duplicates
            var uniqueUsernames = [...new Set(usernames)];
            
            return JSON.stringify({
              usernames: uniqueUsernames,
              total: uniqueUsernames.length,
              url: window.location.href
            });
          } catch (e) {
            return JSON.stringify({ __error: e.message || String(e) });
          }
        })();
      `);

      const parsed = JSON.parse(result || '{}');
      if (parsed.__error) {
        console.error('[Automation] Error extracting usernames:', parsed.__error);
        return [];
      }

      const usernames = parsed.usernames || [];
      console.log(`[Automation] Extracted ${usernames.length} unique usernames from Suggested page`);
      
      return usernames;
    } catch (error) {
      console.error('[Automation] Error extracting usernames from Suggested page:', error);
      return [];
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Convenience function for easy usage
export async function executeAutomation(
  webviewApi: any,
  instagramUsername: string,
  benchmark: BenchmarkResponse,
  options?: AutomationOptions
): Promise<AutomationResult> {
  const service = new AutomationService(webviewApi, instagramUsername, benchmark, options);
  return service.executeAutomation();
}

// Additional utility functions for different automation types
export async function executeFollowAutomation(
  webviewApi: any,
  instagramUsername: string,
  benchmark: BenchmarkResponse,
  options?: AutomationOptions
): Promise<AutomationResult> {
  // Specific implementation for follow automation
  return executeAutomation(webviewApi, instagramUsername, benchmark, options);
}

export async function executeUnfollowAutomation(
  webviewApi: any,
  instagramUsername: string,
  benchmark: BenchmarkResponse,
  options?: AutomationOptions
): Promise<AutomationResult> {
  // Specific implementation for unfollow automation
  return executeAutomation(webviewApi, instagramUsername, benchmark, options);
}

export async function executeLikeAutomation(
  webviewApi: any,
  instagramUsername: string,
  benchmark: BenchmarkResponse,
  options?: AutomationOptions
): Promise<AutomationResult> {
  // Specific implementation for like automation
  return executeAutomation(webviewApi, instagramUsername, benchmark, options);
}
