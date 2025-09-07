/**
 * Example: Suggestion Collection in Automation Service
 * 
 * This example demonstrates how the new suggestion collection stage works
 * in the automation workflow. The suggestion collection happens at the very
 * end of the automation process (Stage 5) and extracts Instagram usernames
 * from the Instagram "Suggested" page.
 */

import { AutomationService, AutomationOptions } from '@/services/automationService';
import { BenchmarkResponse } from '@/api';

// Example usage of the automation service with suggestion collection
export async function runAutomationWithSuggestions(
  webviewApi: any,
  instagramUsername: string,
  benchmark: BenchmarkResponse
) {
  const options: AutomationOptions = {
    scrollDelay: 1000,
    pageLoadDelay: 3000,
    onProgress: (current: number, total: number, status: string) => {
      console.log(`Progress: ${current}/${total} - ${status}`);
    },
    onAction: (action: string, target: string, result: boolean) => {
      console.log(`Action: ${action} on ${target} - ${result ? 'Success' : 'Failed'}`);
    }
  };

  const automationService = new AutomationService(
    webviewApi,
    instagramUsername,
    benchmark,
    options
  );

  try {
    // Execute the complete automation workflow including suggestion collection
    const result = await automationService.executeAutomation();
    
    console.log('Automation completed:', {
      success: result.success,
      actionsPerformed: result.actionsPerformed,
      executionTime: result.executionTime,
      details: {
        followersCollected: result.details.followersCollected,
        followingCollected: result.details.followingCollected,
        unfollowedCount: result.details.unfollowedCount,
        targetsCollected: result.details.targetsCollected,
        followedCount: result.details.followedCount,
        suggestionsCollected: result.details.suggestionsCollected // New!
      }
    });

    return result;
  } catch (error) {
    console.error('Automation failed:', error);
    throw error;
  }
}

// Example of what the suggestion collection stage does:
export const suggestionCollectionWorkflow = {
  description: "Stage 5: Suggestion Collection",
  steps: [
    "1. Navigate to Instagram Suggested page (https://www.instagram.com/explore/people/suggested/)",
    "2. Extract Instagram usernames from the page HTML",
    "3. Filter out reserved usernames and duplicates",
    "4. Create SuggestionCreate objects with ig_username field",
    "5. Send each suggestion to the API using createSuggestionApiV1InstagramSuggestionsPost",
    "6. Track success/failure for each suggestion creation"
  ],
  dataStructure: {
    SuggestionCreate: {
      ig_username: "string" // Instagram username extracted from Suggested page
    }
  },
  apiEndpoint: "POST /api/v1/instagram/suggestions",
  exampleData: [
    { ig_username: "user1" },
    { ig_username: "user2" },
    { ig_username: "user3" }
  ]
};

// Example of the complete automation workflow stages:
export const automationStages = {
  stage1: "Profile Collection - Collect followers and following lists",
  stage2: "Unfollow - Process REQUESTED targets that are 4+ days old",
  stage3: "Target Collection - Collect new targets from healthy benchmarks",
  stage4: "Follow - Process PENDING targets and follow them",
  stage5: "Suggestion Collection - Extract and create suggestions from Suggested page", // New!
  stage6: "Complete - Workflow finished"
};
