import { InstagramService } from '@/api/services/InstagramService';
import type { IGHistoryCreate } from '@/api/models/IGHistoryCreate';

export interface ProfileInfo {
  username: string;
  bio?: string;
  followers?: string;
  following?: string;
  links?: string;
}

export interface ProfileCollectionResult {
  success: boolean;
  profileInfo?: ProfileInfo;
  error?: string;
}

export class ProfileCollectionService {
  private webviewApi: any;

  constructor(webviewApi: any) {
    this.webviewApi = webviewApi;
  }

  /**
   * Instagram 프로필 페이지에서 정보를 수집합니다
   */
  async collectProfileInfo(): Promise<ProfileCollectionResult> {
    try {
      console.log('[Profile Collection] Starting profile information collection...');

      // 프로필 정보 수집 스크립트 실행
      const profileData = await this.webviewApi.executeScript(`
        (() => {
          try {
            const result = {
              username: '',
              bio: '',
              followers: '',
              following: '',
              links: ''
            };

            // Username 추출 (h2 태그 내 span)
            const usernameElement = document.querySelector('h2 span');
            if (usernameElement) {
              result.username = usernameElement.textContent?.trim() || '';
            }

            // Followers 수 추출
            const followersLink = document.querySelector('a[href*="/followers/"]');
            if (followersLink) {
              const followersSpan = followersLink.querySelector('span span');
              if (followersSpan) {
                result.followers = followersSpan.textContent?.trim() || '';
              }
            }

            // Following 수 추출
            const followingLink = document.querySelector('a[href*="/following/"]');
            if (followingLink) {
              const followingSpan = followingLink.querySelector('span span');
              if (followingSpan) {
                result.following = followingSpan.textContent?.trim() || '';
              }
            }

            // Bio 정보 추출 (JSON 형태로 구조화)
            const bioSection = document.querySelector('section[class*="x1xdureb"][class*="x18wylqe"]');
            if (bioSection) {
              const bioData: any = {};
              
              // 이름 부분 (첫 번째 div span[dir="auto"])
              const nameElement = bioSection.querySelector('div span[dir="auto"]');
              if (nameElement) {
                const name = nameElement.textContent?.trim();
                if (name) bioData.name = name;
              }
              
              // 설명 부분 (span[dir="auto"] div)
              const descriptionElement = bioSection.querySelector('span[dir="auto"] div');
              if (descriptionElement) {
                const description = descriptionElement.textContent?.trim();
                if (description) bioData.description = description;
              }
              
              // 해시태그 추출
              const hashtags: string[] = [];
              const hashtagLinks = bioSection.querySelectorAll('a[href*="/explore/tags/"]');
              hashtagLinks.forEach(link => {
                const hashtag = link.textContent?.trim();
                if (hashtag) hashtags.push(hashtag);
              });
              if (hashtags.length > 0) {
                bioData.hashtags = hashtags;
              }
              
              // JSON 문자열로 변환
              if (Object.keys(bioData).length > 0) {
                result.bio = JSON.stringify(bioData);
              }
            }

            // Links 추출 (프로필 링크, 웹사이트 링크 등)
            const links: string[] = [];
            
            // 프로필 링크 (username 링크)
            const profileLink = document.querySelector('a[href*="/' + result.username + '/"]');
            if (profileLink) {
              const href = profileLink.getAttribute('href');
              if (href) {
                links.push('https://www.instagram.com' + href);
              }
            }
            
            // 웹사이트 링크 (bio에 있는 외부 링크)
            const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="instagram.com"])');
            externalLinks.forEach(link => {
              const href = link.getAttribute('href');
              if (href) {
                links.push(href);
              }
            });
            
            result.links = links.join(', ');

            console.log('[Profile Collection] Collected data:', result);
            return result;
          } catch (error) {
            console.error('[Profile Collection] Error collecting profile info:', error);
            return null;
          }
        })();
      `);

      if (!profileData) {
        throw new Error('Failed to collect profile information');
      }

      console.log('[Profile Collection] Successfully collected profile info:', profileData);

      return {
        success: true,
        profileInfo: profileData
      };

    } catch (error) {
      console.error('[Profile Collection] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 수집한 프로필 정보를 history API로 전송합니다
   */
  async sendProfileHistory(profileInfo: ProfileInfo): Promise<boolean> {
    try {
      console.log('[Profile Collection] Sending profile history for:', profileInfo.username);

      const historyData: IGHistoryCreate = {
        bio: profileInfo.bio || null,
        links: profileInfo.links || null,
        followers: profileInfo.followers || null,
        followings: profileInfo.following || null
      };

      await InstagramService.createHistoryApiV1InstagramHistoryUsernamePost(
        profileInfo.username,
        historyData
      );

      console.log('[Profile Collection] Successfully sent profile history');
      return true;

    } catch (error) {
      console.error('[Profile Collection] Error sending profile history:', error);
      return false;
    }
  }

  /**
   * 프로필 정보 수집 및 history 전송을 한 번에 수행합니다
   */
  async collectAndSendProfileHistory(): Promise<ProfileCollectionResult> {
    try {
      // 1. 프로필 정보 수집
      const collectionResult = await this.collectProfileInfo();
      
      if (!collectionResult.success || !collectionResult.profileInfo) {
        return collectionResult;
      }

      // 2. History API로 전송
      const sendResult = await this.sendProfileHistory(collectionResult.profileInfo);
      
      if (!sendResult) {
        return {
          success: false,
          error: 'Failed to send profile history to API'
        };
      }

      return {
        success: true,
        profileInfo: collectionResult.profileInfo
      };

    } catch (error) {
      console.error('[Profile Collection] Error in collectAndSendProfileHistory:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
