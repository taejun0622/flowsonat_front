import { WebViewControl } from '../features/browser-extension/types';

export interface InstagramElement {
  selector: string;
  text?: string;
  attributes?: Record<string, string>;
}

export interface InstagramUser {
  username: string;
  displayName?: string;
  profileImage?: string;
}

export class InstagramDOMHelper {
  private webViewControl: WebViewControl;

  constructor(webViewControl: WebViewControl) {
    this.webViewControl = webViewControl;
  }

  // Instagram 요소 선택자들
  private readonly selectors = {
    // 프로필 관련
    profileFollowButton: 'button[data-testid="follow-button"]',
    profileUnfollowButton: 'button[data-testid="unfollow-button"]',
    profileFollowersLink: 'a[href*="/followers/"]',
    profileFollowingLink: 'a[href*="/following/"]',
    
    // 모달 관련
    modalCloseButton: 'button[aria-label="Close"]',
    modalBackdrop: 'div[role="dialog"]',
    
    // 사용자 목록 관련
    userListItem: 'div[data-testid="user-item"]',
    userUsername: 'a[data-testid="user-item-username"]',
    userFollowButton: 'button[data-testid="follow-button"]',
    userUnfollowButton: 'button[data-testid="unfollow-button"]',
    
    // 스크롤 관련
    scrollableContainer: 'div[data-testid="scrollable-container"]',
    
    // 로딩 관련
    loadingSpinner: 'div[data-testid="loading-spinner"]',
    
    // 기타
    followButton: 'button:contains("Follow")',
    unfollowButton: 'button:contains("Unfollow")',
    followingButton: 'button:contains("Following")',
    requestedButton: 'button:contains("Requested")'
  };

  // DOM 요소 찾기 (webview 내부)
  private async findElement(selector: string, timeout: number = 5000): Promise<{ rect: { left:number; top:number; width:number; height:number }, text?: string } | null> {
    if (!this.webViewControl.exec) return null;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const info = await this.webViewControl.exec((sel: string) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { rect: { left: r.left, top: r.top, width: r.width, height: r.height }, text: el.textContent || '' };
      }, selector);
      if (info) return info;
      await this.delay(100);
    }
    return null;
  }

  // 여러 요소 찾기
  private async findElements(selector: string): Promise<{ rect: { left:number; top:number; width:number; height:number }, text?: string }[]> {
    if (!this.webViewControl.exec) return [];
    try {
      return await this.webViewControl.exec((sel: string) => {
        const elements = document.querySelectorAll(sel);
        return Array.from(elements).map(el => {
          const r = el.getBoundingClientRect();
          return { rect: { left: r.left, top: r.top, width: r.width, height: r.height }, text: el.textContent || '' };
        });
      }, selector);
    } catch (error) {
      console.error('요소들 찾기 실패:', error);
      return [];
    }
  }

  // mouse_control_extension 방식으로 DOM 이벤트 직접 발생
  private async dispatchMouseEvent(element: HTMLElement, eventType: string, x: number, y: number): Promise<void> {
    if (!this.webViewControl.exec) return;
    
    await this.webViewControl.exec((el: HTMLElement, type: string, clientX: number, clientY: number) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: clientX,
        clientY: clientY
      });
      el.dispatchEvent(event);
    }, element, eventType, x, y);
  }

  // 요소 클릭 (mouse_control_extension 방식)
  private async clickElement(elementInfo: { rect: { left:number; top:number; width:number; height:number } }): Promise<boolean> {
    try {
      if (!this.webViewControl.exec) return false;
      
      const centerX = elementInfo.rect.left + elementInfo.rect.width / 2;
      const centerY = elementInfo.rect.top + elementInfo.rect.height / 2;
      
      // mouse_control_extension과 동일한 방식으로 이벤트 발생
      const success = await this.webViewControl.exec((x: number, y: number) => {
        const element = document.elementFromPoint(x, y);
        if (!element) return false;
        
        // mousedown, mouseup, click 이벤트 순서대로 발생
        element.dispatchEvent(new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: x,
          clientY: y
        }));
        
        element.dispatchEvent(new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: x,
          clientY: y
        }));
        
        element.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: x,
          clientY: y
        }));
        
        return true;
      }, centerX, centerY);
      
      return success;
    } catch (error) {
      console.error('요소 클릭 실패:', error);
      return false;
    }
  }

  // 프로필 페이지로 이동
  async navigateToProfile(username: string): Promise<boolean> {
    try {
      const url = `https://www.instagram.com/${username}/`;
      if (this.webViewControl.navigate) {
        await this.webViewControl.navigate(url);
        await this.delay(2000); // 페이지 로드 대기
        console.log(`프로필 페이지 이동 완료: ${username}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('프로필 페이지 이동 실패:', error);
      return false;
    }
  }

  // 프로필 스냅샷 수집 (bio, 링크, 팔로워/팔로잉 수)
  async getProfileSnapshot(): Promise<{ bio?: string | null; links?: string | null; followers?: string | null; followings?: string | null; }>{
    if (!this.webViewControl.exec) return { bio: null, links: null, followers: null, followings: null };
    try {
      const data = await this.webViewControl.exec(() => {
        // bio 텍스트 찾기 (여러 후보 셀렉터 시도)
        const bioCandidates = [
          'header section div[role="button"] ~ div',
          'header section ul + div',
          'header + section div',
          'div.-vDIg'
        ];
        let bio: string | null = null;
        for (const sel of bioCandidates) {
          const el = document.querySelector(sel) as HTMLElement | null;
          if (el && el.innerText && el.innerText.trim().length > 0) {
            bio = el.innerText.trim();
            break;
          }
        }

        // 링크 수집 (프로필 헤더 내 a 태그 href)
        const header = document.querySelector('header') || document;
        const linkHrefs = Array.from(header.querySelectorAll('a'))
          .map(a => (a as HTMLAnchorElement).href)
          .filter(h => !!h)
          .slice(0, 5);
        const links = linkHrefs.length ? linkHrefs.join(',') : null;

        // 팔로워/팔로잉 수
        const followersAnchor = document.querySelector('a[href*="/followers/"]');
        const followingAnchor = document.querySelector('a[href*="/following/"]');
        const followersText = followersAnchor ? (followersAnchor.textContent || '').trim() : '';
        const followingText = followingAnchor ? (followingAnchor.textContent || '').trim() : '';

        // 숫자만 추출 (예: 1,234 → 1234)
        const extractNumber = (t: string) => {
          const m = t.replace(/[,.]/g, '').match(/\d+/);
          return m ? m[0] : null;
        };
        const followers = extractNumber(followersText);
        const followings = extractNumber(followingText);

        return { bio, links, followers, followings };
      });
      return data || { bio: null, links: null, followers: null, followings: null };
    } catch (e) {
      console.warn('프로필 스냅샷 수집 실패:', e);
      return { bio: null, links: null, followers: null, followings: null };
    }
  }

  // Follow 버튼 확인
  async checkFollowButton(): Promise<boolean> {
    try {
      const followButton = await this.findElement(this.selectors.profileFollowButton);
      return followButton !== null;
    } catch (error) {
      console.error('Follow 버튼 확인 실패:', error);
      return false;
    }
  }

  // Unfollow 버튼 확인
  async checkUnfollowButton(): Promise<boolean> {
    try {
      const unfollowButton = await this.findElement(this.selectors.profileUnfollowButton);
      return unfollowButton !== null;
    } catch (error) {
      console.error('Unfollow 버튼 확인 실패:', error);
      return false;
    }
  }

  // Follow 버튼 클릭
  async clickFollowButton(): Promise<boolean> {
    try {
      const followButton = await this.findElement(this.selectors.profileFollowButton);
      if (!followButton) {
        console.log('Follow 버튼을 찾을 수 없습니다.');
        return false;
      }
      
      const success = await this.clickElement(followButton);
      if (success) {
        console.log('Follow 버튼 클릭 완료');
        await this.delay(1000);
      }
      
      return success;
    } catch (error) {
      console.error('Follow 버튼 클릭 실패:', error);
      return false;
    }
  }

  // Unfollow 버튼 클릭
  async clickUnfollowButton(): Promise<boolean> {
    try {
      const unfollowButton = await this.findElement(this.selectors.profileUnfollowButton);
      if (!unfollowButton) {
        console.log('Unfollow 버튼을 찾을 수 없습니다.');
        return false;
      }
      
      const success = await this.clickElement(unfollowButton);
      if (success) {
        console.log('Unfollow 버튼 클릭 완료');
        await this.delay(1000);
        
        // 확인 버튼 클릭 (있는 경우)
        const confirmButton = await this.findElement('button:contains("Unfollow")');
        if (confirmButton) {
          await this.clickElement(confirmButton);
          await this.delay(1000);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Unfollow 버튼 클릭 실패:', error);
      return false;
    }
  }

  // Follower 모달 열기
  async openFollowersModal(): Promise<boolean> {
    try {
      const followersLink = await this.findElement(this.selectors.profileFollowersLink);
      if (!followersLink) {
        console.log('Follower 링크를 찾을 수 없습니다.');
        return false;
      }
      
      const success = await this.clickElement(followersLink);
      if (success) {
        console.log('Follower 모달 열기 완료');
        await this.waitForModal();
      }
      
      return success;
    } catch (error) {
      console.error('Follower 모달 열기 실패:', error);
      return false;
    }
  }

  // Following 모달 열기
  async openFollowingModal(): Promise<boolean> {
    try {
      const followingLink = await this.findElement(this.selectors.profileFollowingLink);
      if (!followingLink) {
        console.log('Following 링크를 찾을 수 없습니다.');
        return false;
      }
      
      const success = await this.clickElement(followingLink);
      if (success) {
        console.log('Following 모달 열기 완료');
        await this.waitForModal();
      }
      
      return success;
    } catch (error) {
      console.error('Following 모달 열기 실패:', error);
      return false;
    }
  }

  // 모달 닫기
  async closeModal(): Promise<boolean> {
    try {
      const closeButton = await this.findElement(this.selectors.modalCloseButton);
      if (closeButton) {
        await this.clickElement(closeButton);
        console.log('모달 닫기 완료');
        return true;
      }
      return true;
    } catch (error) {
      console.error('모달 닫기 실패:', error);
      return false;
    }
  }

  // 모달 로드 대기
  private async waitForModal(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 50; // 5초
    
    while (attempts < maxAttempts) {
      const modal = await this.findElement(this.selectors.modalBackdrop);
      if (modal) {
        console.log('모달 로드 완료');
        return;
      }
      
      await this.delay(100);
      attempts++;
    }
    
    console.log('모달 로드 타임아웃');
  }

  // mouse_control_extension 방식으로 스크롤하며 사용자 목록 수집
  async scrollAndCollectUsers(): Promise<InstagramUser[]> {
    const users: InstagramUser[] = [];
    let noNewUsersCount = 0;
    const maxNoNewUsers = 3;
    
    try {
      while (noNewUsersCount < maxNoNewUsers) {
        // 현재 페이지의 사용자들 수집
        const currentUsers = await this.collectCurrentPageUsers();
        
        // 새로운 사용자만 추가
        const newUsers = currentUsers.filter(user => 
          !users.some(existing => existing.username === user.username)
        );
        
        users.push(...newUsers);
        console.log(`현재 수집된 사용자: ${users.length}명, 새로 추가된 사용자: ${newUsers.length}명`);
        
        if (newUsers.length === 0) {
          noNewUsersCount++;
        } else {
          noNewUsersCount = 0;
        }
        
        // mouse_control_extension 방식으로 스크롤
        await this.scrollDown();
        await this.delay(1000);
        
        // 무한 루프 방지
        if (users.length > 1000) {
          console.log('최대 사용자 수 도달');
          break;
        }
      }
      
      console.log(`사용자 수집 완료: ${users.length}명`);
      return users;
    } catch (error) {
      console.error('사용자 수집 실패:', error);
      return users;
    }
  }

  // 현재 페이지의 사용자들 수집 (mouse_control_extension 방식)
  private async collectCurrentPageUsers(): Promise<InstagramUser[]> {
    const users: InstagramUser[] = [];
    
    try {
      if (!this.webViewControl.exec) return users;
      
             const userItems = await this.webViewControl.exec(() => {
         // 모달 내부의 사용자 항목들 찾기
         const modal = document.querySelector('div[role="dialog"]');
         if (!modal) return [];
         
         const userItems = modal.querySelectorAll('a[data-testid="user-item-username"]');
         return Array.from(userItems).map(item => {
           const username = item.textContent?.trim();
           return username ? { username } : null;
         }).filter((item): item is { username: string } => item !== null);
       });
       
       users.push(...userItems);
      console.log(`현재 페이지에서 ${userItems.length}명의 사용자 발견`);
    } catch (error) {
      console.error('현재 페이지 사용자 수집 실패:', error);
    }
    
    return users;
  }

  // mouse_control_extension 방식으로 스크롤 다운
  private async scrollDown(): Promise<void> {
    try {
      if (!this.webViewControl.exec) return;
      
      await this.webViewControl.exec(() => {
        // mouse_control_extension과 동일한 방식으로 스크롤 가능한 요소 찾기
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        
        let scrollableElement = document.elementFromPoint(x, y);
        while (scrollableElement && (scrollableElement.scrollHeight <= scrollableElement.clientHeight || getComputedStyle(scrollableElement).overflowY === 'visible')) {
          scrollableElement = scrollableElement.parentElement;
        }
        
        if (scrollableElement) {
          console.log('스크롤 가능한 요소 발견:', scrollableElement);
          scrollableElement.scrollBy(0, 100);
        } else {
          console.log('스크롤 가능한 요소를 찾을 수 없음');
        }
      });
    } catch (error) {
      console.error('스크롤 다운 실패:', error);
    }
  }

  // Follower 모달에서 Follow 버튼이 있는 사용자들 수집
  async collectPotentialTargetsFromFollowers(): Promise<InstagramUser[]> {
    const potentialTargets: InstagramUser[] = [];
    
    try {
      // Follower 모달 열기
      const modalOpened = await this.openFollowersModal();
      if (!modalOpened) {
        return potentialTargets;
      }
      
      // 스크롤하며 사용자들 수집
      const followers = await this.scrollAndCollectUsers();
      
      // 각 사용자의 Follow 버튼 확인
      for (const follower of followers) {
        const hasFollowButton = await this.checkUserFollowButton(follower.username);
        if (hasFollowButton) {
          potentialTargets.push(follower);
        }
      }
      
      // 모달 닫기
      await this.closeModal();
      
      console.log(`잠재적 Target 수집 완료: ${potentialTargets.length}명`);
    } catch (error) {
      console.error('잠재적 Target 수집 실패:', error);
    }
    
    return potentialTargets;
  }

  // 특정 사용자의 Follow 버튼 확인
  private async checkUserFollowButton(_username: string): Promise<boolean> {
    try {
      if (!this.webViewControl.exec) return false;
      
      return await this.webViewControl.exec(() => {
        // 모달 내부에서 Follow 버튼 찾기
        const modal = document.querySelector('div[role="dialog"]');
        if (!modal) return false;
        
        const followButton = modal.querySelector('button[data-testid="follow-button"]');
        return followButton !== null;
      });
    } catch (error) {
      console.error('사용자 Follow 버튼 확인 실패:', error);
      return false;
    }
  }

  // 로딩 완료 대기
  async waitForLoading(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 100; // 10초
    
    while (attempts < maxAttempts) {
      const spinner = await this.findElement(this.selectors.loadingSpinner);
      if (!spinner) {
        console.log('로딩 완료');
        return;
      }
      
      await this.delay(100);
      attempts++;
    }
    
    console.log('로딩 타임아웃');
  }

  // 지연 함수
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 페이지 새로고침
  async refreshPage(): Promise<void> {
    if (this.webViewControl.reload) await this.webViewControl.reload();
  }

  // 현재 URL 확인
  async getCurrentUrl(): Promise<string> {
    if (this.webViewControl.getUrl) return await this.webViewControl.getUrl();
    return '';
  }

  // 로그인 상태 확인
  async isLoggedIn(): Promise<boolean> {
    try {
      if (!this.webViewControl.exec) return false;
      
      return await this.webViewControl.exec(() => {
        const loginIndicator = document.querySelector('a[href="/accounts/activity/"]');
        return loginIndicator !== null;
      });
    } catch (error) {
      console.error('로그인 상태 확인 실패:', error);
      return false;
    }
  }

  // 에러 메시지 확인
  async checkForErrors(): Promise<string[]> {
    try {
      if (!this.webViewControl.exec) return [];
      
      return await this.webViewControl.exec(() => {
        const errorElements = document.querySelectorAll('[role="alert"], .error, .alert');
        return Array.from(errorElements).map(el => el.textContent || '').filter(Boolean);
      });
    } catch (error) {
      console.error('에러 메시지 확인 실패:', error);
      return [];
    }
  }
}
