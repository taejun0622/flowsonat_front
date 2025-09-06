import { InstagramService } from '@/api/services/InstagramService';
import type { IGHistoryCreate } from '@/api/models/IGHistoryCreate';

export interface ProfileInfo {
  username: string;
  bio?: string;
  followers?: string;
  following?: string;
  links?: string;
  raw_data?: string;
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
        (function() {
          try {
            var result = {
              username: '',
              bio: '',
              followers: '',
              following: '',
              links: '',
              raw_data: ''
            };

            // header 태그 찾기
            var headerElement = document.querySelector('header');
            if (!headerElement) {
              console.log('[Profile Collection] Header element not found');
              return result;
            }

            // Username 추출 (h2 태그 내 span)
            var usernameElement = headerElement.querySelector('h2 span');
            if (usernameElement) {
              result.username = usernameElement.textContent ? usernameElement.textContent.trim() : '';
              console.log('[Profile Collection] Found username element:', usernameElement);
              console.log('[Profile Collection] Username text:', result.username);
            } else {
              console.log('[Profile Collection] Username element not found');
              // 대안: h2 태그에서 직접 추출 시도
              var h2Element = headerElement.querySelector('h2');
              if (h2Element) {
                result.username = h2Element.textContent ? h2Element.textContent.trim() : '';
                console.log('[Profile Collection] Username from h2:', result.username);
              }
            }

            // Posts, Followers, Following 수 추출
            var allSpans = headerElement.querySelectorAll('span');
            
            for (var i = 0; i < allSpans.length; i++) {
              var span = allSpans[i];
              var text = span.textContent ? span.textContent.trim() : '';
              
              if (text === 'posts') {
                // 이전 span에서 posts 수 추출
                var prevSpan = span.previousElementSibling;
                if (prevSpan && prevSpan.tagName === 'SPAN') {
                  var postsText = prevSpan.textContent ? prevSpan.textContent.trim() : '';
                  if (postsText) {
                    console.log('[Profile Collection] Posts:', postsText);
                  }
                }
              } else if (text === 'followers') {
                // 이전 span에서 followers 수 추출
                var prevSpan = span.previousElementSibling;
                if (prevSpan && prevSpan.tagName === 'SPAN') {
                  result.followers = prevSpan.textContent ? prevSpan.textContent.trim() : '';
                }
              } else if (text === 'following') {
                // 이전 span에서 following 수 추출
                var prevSpan = span.previousElementSibling;
                if (prevSpan && prevSpan.tagName === 'SPAN') {
                  result.following = prevSpan.textContent ? prevSpan.textContent.trim() : '';
                }
              }
            }

            // Bio 정보 추출 (header 내의 텍스트 내용)
            var bioTexts = [];
            
            // header 내의 모든 텍스트 노드 수집
            var walker = document.createTreeWalker(
              headerElement,
              NodeFilter.SHOW_TEXT,
              {
                acceptNode: function(node) {
                  var text = node.textContent ? node.textContent.trim() : '';
                  if (!text) return NodeFilter.FILTER_REJECT;
                  
                  // username, posts, followers, following은 제외
                  if (text === result.username || 
                      text === 'posts' || 
                      text === 'followers' || 
                      text === 'following' ||
                      text === 'Following' ||
                      text === 'Message' ||
                      text === 'Options' ||
                      text === 'Followed by') {
                    return NodeFilter.FILTER_REJECT;
                  }
                  
                  // 숫자나 숫자+문자(K, M 등)인 경우 제외 (posts, followers, following 수)
                  if (/^\\d+[KMB]?$/.test(text) || /^\\d+\\.\\d+[KMB]?$/.test(text)) {
                    return NodeFilter.FILTER_REJECT;
                  }
                  
                  return NodeFilter.FILTER_ACCEPT;
                }
              }
            );

            var node;
            while (node = walker.nextNode()) {
              var text = node.textContent ? node.textContent.trim() : '';
              if (text && text.length > 1) {
                bioTexts.push(text);
              }
            }

            // Bio 텍스트 정리 및 결합
            if (bioTexts.length > 0) {
              result.bio = bioTexts.join(' ').replace(/\\s+/g, ' ').trim();
            }

            // Links 추출 (프로필 링크, 웹사이트 링크 등)
            var links = [];
            
            // 프로필 링크 (username 링크)
            if (result.username) {
              var profileLink = headerElement.querySelector('a[href*="/' + result.username + '/"]');
              if (profileLink) {
                var href = profileLink.getAttribute('href');
                if (href) {
                  links.push('https://www.instagram.com' + href);
                }
              }
            }
            
            // 웹사이트 링크 (bio에 있는 외부 링크)
            var externalLinks = headerElement.querySelectorAll('a[href^="http"]:not([href*="instagram.com"])');
            for (var j = 0; j < externalLinks.length; j++) {
              var link = externalLinks[j];
              var href = link.getAttribute('href');
              if (href) {
                links.push(href);
              }
            }
            
            result.links = links.join(', ');

            // Raw data 추출 - header 태그의 전체 내용
            if (headerElement) {
              result.raw_data = headerElement.outerHTML;
              console.log('[Profile Collection] Raw data extracted from header');
            }

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
      console.log('[Profile Collection] Full profile info:', profileInfo);

      // Username이 비어있는 경우 에러 처리
      if (!profileInfo.username || profileInfo.username.trim() === '') {
        console.error('[Profile Collection] Username is empty or undefined');
        console.error('[Profile Collection] Cannot send history without username');
        return false;
      }

      const historyData: IGHistoryCreate = {
        raw_data: profileInfo.raw_data || null,
        bio: profileInfo.bio || null,
        links: profileInfo.links || null,
        followers: profileInfo.followers || null,
        followings: profileInfo.following || null
      };

      console.log('[Profile Collection] History data to send:', historyData);

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
