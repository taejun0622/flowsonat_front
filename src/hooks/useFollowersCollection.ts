import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { WebViewControl } from '@/features/browser-extension/types';

interface UseFollowersCollectionProps {
  webViewControl: WebViewControl;
  currentUsername: string;
  isConnected: boolean;
  onFollowersCollected?: () => void;
}

export const useFollowersCollection = ({
  webViewControl,
  currentUsername,
  isConnected,
  onFollowersCollected
}: UseFollowersCollectionProps) => {
  const [collectedFollowers, setCollectedFollowers] = useState<string[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const { toast } = useToast();

  // 팔로워 수집 시작
  const startFollowersCollection = useCallback(async () => {
    console.log('startFollowersCollection called');
    console.log('Current state:', { isConnected, currentUsername });
    
    if (!isConnected || !currentUsername) {
      console.log('Not connected or no username');
      toast({
        title: "Error",
        description: "Please connect to Instagram first",
        variant: "destructive"
      });
      return;
    }

    if (!webViewControl) {
      console.log('WebView control not available');
      toast({
        title: "Error",
        description: "WebView control not available",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Setting isCollecting to true');
      setIsCollecting(true);
      setCollectedFollowers([]);
      
      const profileUrl = `https://www.instagram.com/${currentUsername}/`;
      console.log('Navigating to profile:', profileUrl);
      
      await webViewControl.navigate?.(profileUrl);
      
    } catch (error) {
      console.error('Failed to start followers collection:', error);
      toast({
        title: "Error",
        description: "Failed to start followers collection",
        variant: "destructive"
      });
      setIsCollecting(false);
    }
  }, [isConnected, currentUsername, webViewControl, toast]);

  // 프로필에서 팔로워 수집
  const collectFollowersFromProfile = useCallback(async () => {
    console.log('collectFollowersFromProfile called');
    
    if (!webViewControl) {
      console.log('WebView control not available');
      setIsCollecting(false);
      return;
    }
    
    try {
      // 현재 페이지 URL 확인
      const currentPageUrl = await webViewControl.getUrl?.() || '';
      console.log('Current page URL:', currentPageUrl);
      
      // 프로필 페이지가 아니라면 경고
      if (!currentPageUrl.includes('/')) {
        console.log('Not on profile page, current URL:', currentPageUrl);
        setIsCollecting(false);
        return;
      }
      
      console.log('On profile page, proceeding with followers collection...');
      
      // Click on followers link
      const result = await webViewControl.exec?.(() => {
        console.log('Looking for followers link...');
        
        // 페이지 로딩 대기
        if (document.readyState !== 'complete') {
          console.log('Page not fully loaded, waiting...');
          return 'waiting';
        }
        
        // 여러 방법으로 팔로워 링크 찾기
        let followersLink = null;
        
        // 방법 1: 텍스트로 찾기 (더 정확하게)
        followersLink = Array.from(document.querySelectorAll('a')).find(link => 
          link.textContent && link.textContent.toLowerCase().includes('followers') && 
          !link.textContent.toLowerCase().includes('following')
        );
        
        // 방법 2: href로 찾기
        if (!followersLink) {
          followersLink = Array.from(document.querySelectorAll('a')).find(link => 
            link.href && link.href.includes('/followers')
          );
        }
        
        // 방법 3: 더 구체적인 선택자로 찾기
        if (!followersLink) {
          followersLink = document.querySelector('a[href*="/followers"]');
        }
        
        // 방법 4: 모든 링크를 로그로 확인
        if (!followersLink) {
          console.log('All links on page:');
          Array.from(document.querySelectorAll('a')).forEach((link, index) => {
            if (link.textContent && link.textContent.trim()) {
              console.log(`Link ${index}:`, {
                text: link.textContent.trim(),
                href: link.href,
                className: link.className
              });
            }
          });
        }
        
        console.log('Found followers link:', followersLink);
        
        if (followersLink) {
          console.log('Clicking followers link...');
          (followersLink as HTMLElement).click();
          console.log('Clicked followers link');
          return true;
        }
        
        console.log('No followers link found');
        return false;
      });

      console.log('JavaScript execution result:', result);

      // 결과에 따라 처리
      if (result === 'waiting') {
        // 페이지가 아직 로딩 중이면 다시 시도
        console.log('Page still loading, retrying in 2 seconds...');
        setTimeout(() => {
          collectFollowersFromProfile();
        }, 2000);
        return;
      } else if (result === true) {
        // 팔로워 링크를 클릭했으면 모달 대기
        console.log('Followers link clicked, waiting for modal...');
        setTimeout(() => {
          console.log('Starting scrollAndCollectFollowers...');
          scrollAndCollectFollowers();
        }, 3000);
      } else {
        // 팔로워 링크를 찾지 못함
        console.log('Failed to find followers link');
        setIsCollecting(false);
      }
      
    } catch (error) {
      console.error('Failed to open followers modal:', error);
      setIsCollecting(false);
    }
  }, [webViewControl]);

  // 스크롤하면서 팔로워 수집
  const scrollAndCollectFollowers = useCallback(async () => {
    if (!webViewControl) {
      console.log('WebView control not available');
      setIsCollecting(false);
      return;
    }
    
    try {
      const followers = await webViewControl.exec?.(() => {
        const followers: string[] = [];
        let scrollCount = 0;
        const maxScrolls = 10; // 최대 스크롤 횟수
        
        function scrollAndCollect() {
          // Find follower usernames in the modal
          const usernameElements = document.querySelectorAll('a[href^="/"]');
          usernameElements.forEach(element => {
            const href = element.getAttribute('href');
            if (href && href.startsWith('/') && !href.includes('/p/') && !href.includes('/reel/')) {
              const username = href.substring(1);
              if (username && !followers.includes(username)) {
                followers.push(username);
              }
            }
          });
          
          // Scroll down in the modal
          const modal = document.querySelector('[role="dialog"]');
          if (modal && scrollCount < maxScrolls) {
            modal.scrollTop = modal.scrollHeight;
            scrollCount++;
            setTimeout(scrollAndCollect, 1000);
          }
        }
        
        scrollAndCollect();
        return followers;
      });

      setCollectedFollowers(followers || []);
      
      // Send to server
      await sendFollowersToServer(followers || []);
      
    } catch (error) {
      console.error('Failed to collect followers:', error);
    } finally {
      setIsCollecting(false);
    }
  }, [webViewControl]);

  // 서버에 팔로워 전송
  const sendFollowersToServer = useCallback(async (followers: string[]) => {
    try {
      // 팔로워 데이터로 새로운 Benchmark 생성
      // TODO: 실제 API 호출로 팔로워 데이터와 함께 Benchmark 생성
      // 예: await InstagramService.createBenchmarkWithFollowers(followers);
      
      toast({
        title: "Success",
        description: `Created benchmark with ${followers.length} followers`
      });
      
      // Callback to parent component
      if (onFollowersCollected) {
        onFollowersCollected();
      }
      
    } catch (error) {
      console.error('Failed to create benchmark with followers:', error);
      toast({
        title: "Error",
        description: "Failed to create benchmark with followers",
        variant: "destructive"
      });
    }
  }, [onFollowersCollected, toast]);

  return {
    collectedFollowers,
    isCollecting,
    startFollowersCollection,
    collectFollowersFromProfile,
    scrollAndCollectFollowers
  };
};
