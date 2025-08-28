import { InstagramService } from '../api/services/InstagramService';
import { HealthEnum } from '../api/models/HealthEnum';
import { StatusEnum } from '../api/models/StatusEnum';
import { StageEnum } from '../api/models/StageEnum';
import { TargetResponse } from '../api/models/TargetResponse';
import { BenchmarkResponse } from '../api/models/BenchmarkResponse';
import { FollowResponse } from '../api/models/FollowResponse';
import { ApiError } from '../api/core/ApiError';
import { WebViewControl } from '../features/browser-extension/types';
import { InstagramDOMHelper } from './instagramDOMHelper';

export interface InstagramAutomationConfig {
  maxTargets: number;
  maxUnfollows: number;
  unfollowDelayDays: number;
  scrollDelay: number;
  clickDelay: number;
}

export interface AutomationState {
  isRunning: boolean;
  currentStep: string;
  progress: number;
  totalSteps: number;
  currentStepIndex: number;
}

export interface UserProfile {
  username: string;
  ig_user_id?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

export class InstagramAutomationService {
  private config: InstagramAutomationConfig;
  private state: AutomationState;
  private webViewControl?: WebViewControl;
  private dom?: InstagramDOMHelper;

  constructor(
    webViewControl?: WebViewControl,
    config: Partial<InstagramAutomationConfig> = {},
    domHelper?: InstagramDOMHelper
  ) {
    this.config = {
      maxTargets: 500,
      maxUnfollows: 250,
      unfollowDelayDays: 4,
      scrollDelay: 1000,
      clickDelay: 500,
      ...config
    };

    this.state = {
      isRunning: false,
      currentStep: '',
      progress: 0,
      totalSteps: 0,
      currentStepIndex: 0
    };

    this.webViewControl = webViewControl;
    this.dom = domHelper;
  }

  // Utility methods
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async waitForElement(selector: string, timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      // DOM element check logic (actual implementation needs webview internal DOM access)
      // For now, we'll simulate waiting for the element with the given selector
      console.log(`Waiting for element: ${selector}`);
      await this.delay(100);
    }
    return false;
  }

  private async scrollToBottom(): Promise<void> {
    // Scroll down logic
    for (let i = 0; i < 10; i++) {
      if (this.webViewControl) {
        this.webViewControl.scroll(0, 1000);
      }
      await this.delay(this.config.scrollDelay);
    }
  }

  // 1. Profile information collection
  async collectProfileInfo(username: string): Promise<void> {
    try {
      this.updateState('Collecting profile information...', 1, 8);
      // this.currentUsername = username; // Removed as per new_code
      
      // Navigate to profile page
      if (this.dom) {
        await this.dom.navigateToProfile(username);
      } else {
        if (this.dom) await this.dom.navigateToProfile(username);
      }
      
      // Call profile history API
      const historyResponse = await InstagramService.getHistoryByUsernameApiV1InstagramHistoryUsernameGet(username);
      console.log(`Profile information collected: ${username}`, historyResponse);
      
    } catch (error) {
      console.error('Profile information collection failed:', error);
      if (error instanceof ApiError) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw error;
    }
  }

  // 2. Follower information collection and update
  async collectFollowers(username: string): Promise<void> {
    try {
      this.updateState('Collecting follower information...', 2, 8);
      
      // Navigate to profile page
      if (this.dom) {
        await this.dom.navigateToProfile(username);
      } else {
        if (this.dom) await this.dom.navigateToProfile(username);
      }
      
      // Open followers modal
      if (this.dom) await this.dom.openFollowersModal(); else await this.openFollowersModal();
      
      // Scroll and collect follower list
      const followers = this.dom ? await this.dom.scrollAndCollectUsers() : await this.scrollAndCollectUsers();
      
      // Get existing follower information via API
      const existingFollowers = await InstagramService.getFollowersApiV1InstagramFollowersUsernameGet(username);
      
      // Filter new followers and update via API
      const newFollowers = followers.filter(follower => 
        !existingFollowers.some((existing: FollowResponse) => existing.following_username === follower.username)
      );
      
      if (newFollowers.length > 0) {
        console.log(`Found ${newFollowers.length} new followers`);
        // Create follow relationships for new followers
        for (const follower of newFollowers) {
          try {
            await InstagramService.createFollowRelationshipApiV1InstagramFollowPost({
              follower_username: username,
              following_username: follower.username
            });
          } catch (error) {
            console.error(`Failed to create follow relationship for ${follower.username}:`, error);
          }
        }
      }
      
      console.log(`Follower information collection completed: ${followers.length} followers`);
    } catch (error) {
      console.error('Follower information collection failed:', error);
      if (error instanceof ApiError) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw error;
    }
  }

  // 3. Following information collection and update
  async collectFollowing(username: string): Promise<void> {
    try {
      this.updateState('Collecting following information...', 3, 8);
      
      // Navigate to profile page
      if (this.dom) {
        await this.dom.navigateToProfile(username);
      } else {
        if (this.dom) await this.dom.navigateToProfile(username);
      }
      
      // Open following modal
      if (this.dom) await this.dom.openFollowingModal(); else await this.openFollowingModal();
      
      // Scroll and collect following list
      const following = this.dom ? await this.dom.scrollAndCollectUsers() : await this.scrollAndCollectUsers();
      
      // Get existing following information via API
      const existingFollowing = await InstagramService.getFollowingApiV1InstagramFollowingUsernameGet(username);
      
      // Filter new following and update via API
      const newFollowing = following.filter(follow => 
        !existingFollowing.some((existing: FollowResponse) => existing.following_username === follow.username)
      );
      
      if (newFollowing.length > 0) {
        console.log(`Found ${newFollowing.length} new following`);
        // Create follow relationships for new following
        for (const follow of newFollowing) {
          try {
            await InstagramService.createFollowRelationshipApiV1InstagramFollowPost({
              follower_username: username,
              following_username: follow.username
            });
          } catch (error) {
            console.error(`Failed to create follow relationship for ${follow.username}:`, error);
          }
        }
      }
      
      console.log(`Following information collection completed: ${following.length} following`);
    } catch (error) {
      console.error('Following information collection failed:', error);
      if (error instanceof ApiError) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw error;
    }
  }

  // 4. Unfollow processing
  async processUnfollows(): Promise<void> {
    try {
      this.updateState('Processing unfollows...', 4, 8);
      
      // Get targets for unfollow (REQUESTED status and older than 4 days)
      const targets = await this.getTargetsForUnfollow();
      
      if (targets.length === 0) {
        console.log('No targets to unfollow.');
        return;
      }
      
      let unfollowCount = 0;
      
      for (const target of targets) {
        if (unfollowCount >= this.config.maxUnfollows) {
          console.log(`Reached maximum unfollow limit: ${this.config.maxUnfollows}`);
          break;
        }
        
        try {
          // Navigate to profile page
          if (this.dom) await this.dom.navigateToProfile(target.ig.username);
          
          // Click unfollow button
          const unfollowed = this.dom ? await this.dom.clickUnfollowButton() : await this.clickUnfollowButton();
          
          if (unfollowed) {
            // Update target stage to UNFOLLOWED via API
            await this.updateTargetStage(target.id, StageEnum.UNFOLLOWED);
            unfollowCount++;
            
            console.log(`Unfollow completed: ${target.ig.username}`);
          }
          
          await this.delay(this.config.clickDelay);
        } catch (error) {
          console.error(`Unfollow failed for ${target.ig.username}:`, error);
        }
      }
      
      console.log(`Unfollow processing completed: ${unfollowCount} users`);
    } catch (error) {
      console.error('Unfollow processing failed:', error);
      if (error instanceof ApiError) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw error;
    }
  }

  // 5. Target collection
  async collectTargets(): Promise<void> {
    try {
      this.updateState('Collecting targets...', 5, 8);
      
      // Get current target count
      const currentTargets = await this.getPendingTargets();
      
      if (currentTargets.length >= this.config.maxTargets) {
        console.log(`Target count reached maximum: ${currentTargets.length}`);
        return;
      }
      
      // Get healthy and active benchmarks
      const benchmarks = await this.getHealthyBenchmarks();
      
      // Shuffle benchmarks for randomization
      const shuffledBenchmarks = this.shuffleArray(benchmarks);
      
      let targetCount = 0;
      const maxNewTargets = this.config.maxTargets - currentTargets.length;
      
      for (const benchmark of shuffledBenchmarks) {
        if (targetCount >= maxNewTargets) break;
        
        try {
          // Navigate to profile page
          if (this.dom) await this.dom.navigateToProfile(benchmark.ig.username);
          
          // Check if follow button exists
          const hasFollowButton = this.dom ? await this.dom.checkFollowButton() : await this.checkFollowButton();
          
          if (hasFollowButton) {
            // Open followers modal and collect potential targets
            const potentialTargets = this.dom ? await this.dom.collectPotentialTargetsFromFollowers() : await this.collectPotentialTargetsFromFollowers();
            
            // Create targets
            for (const potentialTarget of potentialTargets) {
              if (targetCount >= maxNewTargets) break;
              
              await this.createTarget(potentialTarget, benchmark.id);
              targetCount++;
            }
          }
          
          await this.delay(this.config.clickDelay);
        } catch (error) {
          console.error(`Target collection failed for ${benchmark.ig.username}:`, error);
        }
      }
      
      console.log(`Target collection completed: ${targetCount} targets`);
    } catch (error) {
      console.error('Target collection failed:', error);
      if (error instanceof ApiError) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw error;
    }
  }

  // 6. Follow processing
  async processFollows(): Promise<void> {
    try {
      this.updateState('Processing follows...', 6, 8);
      
      // Get PENDING status targets
      const targets = await this.getPendingTargets();
      
      if (targets.length === 0) {
        console.log('No targets to follow.');
        return;
      }
      
      // Calculate unfollowed count
      const unfollowedCount = await this.getUnfollowedCount();
      const maxFollows = 500 - unfollowedCount;
      
      let followCount = 0;
      
      for (const target of targets) {
        if (followCount >= maxFollows) {
          console.log(`Reached maximum follow limit: ${maxFollows}`);
          break;
        }
        
        try {
          // Navigate to profile page
          if (this.dom) await this.dom.navigateToProfile(target.ig.username);
          
          // Check if unfollow button exists (already following)
          const hasUnfollowButton = this.dom ? await this.dom.checkUnfollowButton() : await this.checkUnfollowButton();
          
          if (hasUnfollowButton) {
            // Already following, update to FOLLOW_BACK
            await this.updateTargetStage(target.id, StageEnum.FOLLOW_BACK);
            console.log(`Already following: ${target.ig.username}`);
          } else {
            // Click follow button
            const followed = this.dom ? await this.dom.clickFollowButton() : await this.clickFollowButton();
            
            if (followed) {
              await this.updateTargetStage(target.id, StageEnum.REQUESTED);
              followCount++;
              console.log(`Follow completed: ${target.ig.username}`);
            }
          }
          
          await this.delay(this.config.clickDelay);
        } catch (error) {
          console.error(`Follow failed for ${target.ig.username}:`, error);
        }
      }
      
      console.log(`Follow processing completed: ${followCount} users`);
    } catch (error) {
      console.error('Follow processing failed:', error);
      if (error instanceof ApiError) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw error;
    }
  }

  // Complete workflow execution
  async runWorkflow(username: string): Promise<void> {
    try {
      this.state.isRunning = true;
      this.state.totalSteps = 8;
      
      console.log('Instagram automation workflow started');
      
      // 1. Collect profile information
      await this.collectProfileInfo(username);
      
      // 2. Collect follower information
      await this.collectFollowers(username);
      
      // 3. Collect following information
      await this.collectFollowing(username);
      
      // 4. Process unfollows
      await this.processUnfollows();
      
      // 5. Collect targets
      await this.collectTargets();
      
      // 6. Process follows
      await this.processFollows();
      
      this.updateState('Workflow completed', 8, 8);
      console.log('Instagram automation workflow completed');
      
    } catch (error) {
      console.error('Workflow execution failed:', error);
      throw error;
    } finally {
      this.state.isRunning = false;
    }
  }

  // State management
  private updateState(step: string, currentIndex: number, total: number): void {
    this.state.currentStep = step;
    this.state.currentStepIndex = currentIndex;
    this.state.totalSteps = total;
    this.state.progress = (currentIndex / total) * 100;
  }

  getState(): AutomationState {
    return { ...this.state };
  }

  stopWorkflow(): void {
    this.state.isRunning = false;
    console.log('Workflow stopped');
  }

  // Helper methods for webview DOM manipulation
  private async navigateToProfile(username: string): Promise<void> {
    const profileUrl = `https://www.instagram.com/${username}/`;
    // Implement webview navigation
    console.log(`Navigating to profile: ${profileUrl}`);
    // Note: This would need to be implemented with webview navigation
    // For now, we'll use the webViewControl to simulate navigation
    if (this.webViewControl) {
      // This is a placeholder - actual navigation would need webview URL change
      console.log(`Would navigate to: ${profileUrl}`);
      // Wait for page to load
      await this.waitForElement('main', 5000);
    }
  }

  private async openFollowersModal(): Promise<void> {
    // Implement followers modal opening
    console.log('Opening followers modal');
    if (this.webViewControl) {
      // Click on followers count to open modal
      this.webViewControl.click(400, 200); // Example coordinates for followers link
      await this.delay(this.config.clickDelay);
      // Wait for modal to open
      await this.waitForElement('[role="dialog"]', 3000);
    }
  }

  private async openFollowingModal(): Promise<void> {
    // Implement following modal opening
    console.log('Opening following modal');
    if (this.webViewControl) {
      // Click on following count to open modal
      this.webViewControl.click(500, 200); // Example coordinates for following link
      await this.delay(this.config.clickDelay);
      // Wait for modal to open
      await this.waitForElement('[role="dialog"]', 3000);
    }
  }

  private async scrollAndCollectUsers(): Promise<UserProfile[]> {
    // Implement user list collection from modal
    if (this.webViewControl) {
      // Wait for user list to be visible
      await this.waitForElement('ul[role="list"]', 3000);
      // Scroll through the user list
      await this.scrollToBottom();
    }
    return [];
  }

  // API helper methods
  private async getTargetsForUnfollow(): Promise<TargetResponse[]> {
    try {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - this.config.unfollowDelayDays);
      
      // Get all benchmarks for current user
      const benchmarks = await InstagramService.getBenchmarksApiV1InstagramBenchmarksGet();
      
      const targetsForUnfollow: TargetResponse[] = [];
      
      for (const benchmark of benchmarks.benchmarks || []) {
        // Get targets with REQUESTED stage
        const targets = await InstagramService.getTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsGet(
          benchmark.id,
          StageEnum.REQUESTED
        );
        
        // Filter targets older than unfollowDelayDays
        const oldTargets = targets.targets?.filter(target => {
          const targetDate = new Date(target.created_at);
          return targetDate < fourDaysAgo;
        }) || [];
        
        targetsForUnfollow.push(...oldTargets);
      }
      
      return targetsForUnfollow;
    } catch (error) {
      console.error('Failed to get targets for unfollow:', error);
      return [];
    }
  }

  private async clickUnfollowButton(): Promise<boolean> {
    // Implement unfollow button click
    if (this.webViewControl) {
      // Wait for unfollow button to be visible
      const buttonFound = await this.waitForElement('button[data-testid="unfollow"]', 3000);
      if (buttonFound) {
        // Simulate clicking the unfollow button (coordinates would need to be determined)
        this.webViewControl.click(500, 300); // Example coordinates
        await this.delay(this.config.clickDelay);
        return true;
      }
    }
    return false;
  }

  private async updateTargetStage(targetId: string, stage: StageEnum): Promise<void> {
    try {
      await InstagramService.updateTargetApiV1InstagramTargetsTargetIdPut(targetId, {
        stage: stage
      });
    } catch (error) {
      console.error(`Failed to update target stage for ${targetId}:`, error);
      throw error;
    }
  }

  private async getPendingTargets(): Promise<TargetResponse[]> {
    try {
      // Get all benchmarks for current user
      const benchmarks = await InstagramService.getBenchmarksApiV1InstagramBenchmarksGet();
      
      const pendingTargets: TargetResponse[] = [];
      
      for (const benchmark of benchmarks.benchmarks || []) {
        // Get targets with PENDING stage
        const targets = await InstagramService.getTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsGet(
          benchmark.id,
          StageEnum.PENDING
        );
        
        pendingTargets.push(...(targets.targets || []));
      }
      
      return pendingTargets;
    } catch (error) {
      console.error('Failed to get pending targets:', error);
      return [];
    }
  }

  private async getHealthyBenchmarks(): Promise<BenchmarkResponse[]> {
    try {
      const response = await InstagramService.getBenchmarksApiV1InstagramBenchmarksGet(
        HealthEnum.HEALTHY,
        StatusEnum.ACTIVE
      );
      return response.benchmarks || [];
    } catch (error) {
      console.error('Failed to get healthy benchmarks:', error);
      return [];
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async checkFollowButton(): Promise<boolean> {
    // Implement follow button existence check
    return false;
  }

  private async collectPotentialTargetsFromFollowers(): Promise<UserProfile[]> {
    // Implement potential target collection from followers modal
    return [];
  }

  private async createTarget(targetData: UserProfile, benchmarkId: string): Promise<void> {
    try {
      await InstagramService.createTargetApiV1InstagramBenchmarksBenchmarkIdTargetsPost(benchmarkId, {
        ig_username: targetData.username
      });
    } catch (error) {
      console.error(`Failed to create target for ${targetData.username}:`, error);
      throw error;
    }
  }

  private async getUnfollowedCount(): Promise<number> {
    try {
      // Get all benchmarks for current user
      const benchmarks = await InstagramService.getBenchmarksApiV1InstagramBenchmarksGet();
      
      let unfollowedCount = 0;
      
      for (const benchmark of benchmarks.benchmarks || []) {
        // Get targets with UNFOLLOWED stage
        const targets = await InstagramService.getTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsGet(
          benchmark.id,
          StageEnum.UNFOLLOWED
        );
        
        unfollowedCount += targets.targets?.length || 0;
      }
      
      return unfollowedCount;
    } catch (error) {
      console.error('Failed to get unfollowed count:', error);
      return 0;
    }
  }

  private async checkUnfollowButton(): Promise<boolean> {
    // Implement unfollow button existence check
    return false;
  }

  private async clickFollowButton(): Promise<boolean> {
    // Implement follow button click
    if (this.webViewControl) {
      // Wait for follow button to be visible
      const buttonFound = await this.waitForElement('button[data-testid="follow"]', 3000);
      if (buttonFound) {
        // Simulate clicking the follow button (coordinates would need to be determined)
        this.webViewControl.click(500, 300); // Example coordinates
        await this.delay(this.config.clickDelay);
        return true;
      }
    }
    return false;
  }
}
